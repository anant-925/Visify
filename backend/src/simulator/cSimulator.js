'use strict';

/**
 * C/C++ execution simulator.
 * Handles a subset of C/C++ and produces step-by-step snapshots.
 */

function parseCValue(raw) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  if (s === 'true' || s === 'TRUE') return true;
  if (s === 'false' || s === 'FALSE') return false;
  const n = Number(s);
  if (!isNaN(n) && s !== '') return n;
  return s;
}

function evalCExpr(expr, vars) {
  const s = expr.trim();
  if (s === 'true' || s === 'TRUE') return true;
  if (s === 'false' || s === 'FALSE') return false;
  // string literal
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  // array index
  const idxMatch = s.match(/^([a-zA-Z_]\w*)\[(.+)\]$/);
  if (idxMatch) {
    const arr = vars[idxMatch[1]];
    const idx = evalCExpr(idxMatch[2], vars);
    if (Array.isArray(arr) && typeof idx === 'number') return arr[idx];
    return undefined;
  }
  // variable lookup
  if (/^[a-zA-Z_]\w*$/.test(s) && s in vars) return vars[s];
  // pre/post increment in expression: ++x / x++
  const preInc = s.match(/^\+\+([a-zA-Z_]\w*)$/);
  if (preInc && preInc[1] in vars) return vars[preInc[1]] + 1;
  // arithmetic (simple two operands)
  const arithMatch = s.match(/^(.+?)\s*([+\-*\/%])\s*(.+)$/);
  if (arithMatch) {
    const left = evalCExpr(arithMatch[1].trim(), vars);
    const op = arithMatch[2];
    const right = evalCExpr(arithMatch[3].trim(), vars);
    if (typeof left === 'number' && typeof right === 'number') {
      switch (op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? Math.trunc(left / right) : 0;
        case '%': return left % right;
      }
    }
  }
  const n = Number(s);
  if (!isNaN(n) && s !== '') return n;
  return s;
}

function evalCCondition(cond, vars) {
  const s = cond.trim();
  const compMatch = s.match(/^(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
  if (compMatch) {
    const left = evalCExpr(compMatch[1].trim(), vars);
    const op = compMatch[2];
    const right = evalCExpr(compMatch[3].trim(), vars);
    switch (op) {
      case '==': return left == right; // eslint-disable-line eqeqeq
      case '!=': return left != right; // eslint-disable-line eqeqeq
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
    }
  }
  const val = evalCExpr(s, vars);
  return Boolean(val);
}

function stripLineComment(line) {
  const idx = line.indexOf('//');
  return idx === -1 ? line : line.substring(0, idx);
}

function removeBlockComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '');
}

function tokenizeLines(code) {
  const cleaned = removeBlockComments(code);
  return cleaned.split('\n').map(l => stripLineComment(l));
}

function getIndent(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

const C_TYPES = new Set(['int', 'float', 'double', 'char', 'long', 'short', 'bool', 'string', 'void',
  'unsigned', 'signed', 'auto', 'const', 'static']);

class CSimulator {
  constructor(code) {
    this.lines = tokenizeLines(code);
    this.snapshots = [];
    this.stepCount = 0;
    this.output = [];
    this.maxSteps = 200;
    this.functions = {};
  }

  snapshot(lineIdx, variables, stackFrames, description) {
    this.stepCount++;
    this.snapshots.push({
      step: this.stepCount,
      line: lineIdx + 1,
      lineExecuting: this.lines[lineIdx] || '',
      variables: JSON.parse(JSON.stringify(variables)),
      stackFrames: JSON.parse(JSON.stringify(stackFrames)),
      output: [...this.output],
      description
    });
  }

  simulate() {
    // First pass: collect function definitions
    this._collectFunctions();
    const globalVars = {};
    const stack = [{ name: 'global', variables: globalVars, line: 0 }];
    // Find and execute main
    if (this.functions['main']) {
      const f = this.functions['main'];
      stack.push({ name: 'main', variables: {}, line: f.bodyStart });
      this._execBlock(f.bodyStart, f.bodyEnd, f.indent + 2, {}, stack);
      stack.pop();
    } else {
      this._execBlock(0, this.lines.length, 0, globalVars, stack);
    }
    return this.snapshots;
  }

  _collectFunctions() {
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      const funcMatch = line.match(/^(?:\w+\s+)+(\w+)\s*\(([^)]*)\)\s*\{?\s*$/);
      if (funcMatch && !line.startsWith('//') && !line.startsWith('if') && !line.startsWith('for') && !line.startsWith('while')) {
        const name = funcMatch[1];
        const params = funcMatch[2].split(',').map(p => {
          const parts = p.trim().split(/\s+/);
          return parts[parts.length - 1].replace(/[*&]/g, '');
        }).filter(Boolean);
        const indent = getIndent(this.lines[i]);
        let bodyStart = i + 1;
        // find opening brace line if not on def line
        if (!line.endsWith('{')) {
          while (bodyStart < this.lines.length && !this.lines[bodyStart].trim().startsWith('{')) bodyStart++;
          bodyStart++;
        }
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        this.functions[name] = { name, params, bodyStart, bodyEnd, indent };
      }
    }
  }

  _execBlock(startIdx, endIdx, baseIndent, vars, stack) {
    let i = startIdx;
    while (i < endIdx && this.stepCount < this.maxSteps) {
      const rawLine = this.lines[i];
      if (rawLine === undefined) break;
      const line = rawLine.trim();
      if (line === '' || line === '{' || line === '}' || line.startsWith('#include') || line.startsWith('#define')) {
        i++; continue;
      }

      const indent = getIndent(rawLine);
      if (indent < baseIndent - 2 && baseIndent > 0) break;

      // --- for loop ---
      const forMatch = line.match(/^for\s*\(\s*(?:int\s+)?(\w+)\s*=\s*([^;]+);\s*(.+?);\s*(.+?)\s*\)\s*\{?$/);
      if (forMatch) {
        const initVar = forMatch[1];
        const initVal = evalCExpr(forMatch[2], vars);
        vars[initVar] = initVal;
        this.snapshot(i, vars, stack, `for init: ${initVar} = ${initVal}`);
        const cond = forMatch[3];
        const updateExpr = forMatch[4].trim();
        const bodyStart = line.endsWith('{') ? i + 1 : i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        let iterations = 0;
        while (evalCCondition(cond, vars) && this.stepCount < this.maxSteps && iterations < 100) {
          iterations++;
          this.snapshot(i, vars, stack, `for condition true: ${cond}`);
          this._execBlock(bodyStart, bodyEnd, indent + 2, vars, stack);
          // update
          this._applyUpdate(updateExpr, vars);
          this.snapshot(i, vars, stack, `for update: ${updateExpr}`);
        }
        this.snapshot(i, vars, stack, `for ended`);
        i = bodyEnd + 1;
        continue;
      }

      // --- while loop ---
      const whileMatch = line.match(/^while\s*\((.+)\)\s*\{?$/);
      if (whileMatch) {
        const cond = whileMatch[1];
        this.snapshot(i, vars, stack, `while: ${cond}`);
        const bodyStart = i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        let iterations = 0;
        while (evalCCondition(cond, vars) && this.stepCount < this.maxSteps && iterations < 50) {
          iterations++;
          this.snapshot(i, vars, stack, `while true: ${cond}`);
          this._execBlock(bodyStart, bodyEnd, indent + 2, vars, stack);
        }
        this.snapshot(i, vars, stack, `while ended`);
        i = bodyEnd + 1;
        continue;
      }

      // --- if/else if ---
      const ifMatch = line.match(/^(?:else\s+)?if\s*\((.+)\)\s*\{?$/);
      if (ifMatch) {
        const cond = ifMatch[1];
        const result = evalCCondition(cond, vars);
        this.snapshot(i, vars, stack, `if (${cond}) → ${result}`);
        const bodyStart = i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        if (result) {
          this._execBlock(bodyStart, bodyEnd, indent + 2, vars, stack);
          i = this._skipElseChain(bodyEnd, indent);
        } else {
          i = bodyEnd;
          // check for else
          const elseLine = (this.lines[i] || '').trim();
          if (elseLine.startsWith('else') && !elseLine.startsWith('else if')) {
            const elseBodyStart = i + 1;
            const elseBodyEnd = this._findBlockEnd(elseBodyStart, indent);
            this.snapshot(i, vars, stack, `else branch`);
            this._execBlock(elseBodyStart, elseBodyEnd, indent + 2, vars, stack);
            i = elseBodyEnd + 1;
          }
        }
        continue;
      }

      // --- return ---
      const returnMatch = line.match(/^return\s*(.+?);?$/);
      if (returnMatch) {
        const val = evalCExpr(returnMatch[1].replace(/;$/, ''), vars);
        vars['__return__'] = val;
        this.snapshot(i, vars, stack, `return ${JSON.stringify(val)}`);
        i++;
        break;
      }

      // --- printf / cout ---
      const printfMatch = line.match(/^printf\s*\(\s*"([^"]*)"(?:,\s*(.+))?\s*\)\s*;?$/);
      if (printfMatch) {
        let fmt = printfMatch[1];
        if (printfMatch[2]) {
          const args = printfMatch[2].split(',').map(a => evalCExpr(a.trim(), vars));
          let argIdx = 0;
          fmt = fmt.replace(/%[difs]/g, () => args[argIdx++] !== undefined ? args[argIdx - 1] : '?');
        }
        fmt = fmt.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        this.output.push(fmt);
        this.snapshot(i, vars, stack, `printf: ${fmt}`);
        i++;
        continue;
      }

      const coutMatch = line.match(/^(?:std::)?cout\s*<<\s*(.+?)\s*;?$/);
      if (coutMatch) {
        const parts = coutMatch[1].split('<<').map(p => p.trim());
        const out = parts.map(p => {
          if (p === 'endl' || p === 'std::endl') return '\n';
          const v = evalCExpr(p, vars);
          return v !== undefined ? String(v) : p;
        }).join('');
        this.output.push(out);
        this.snapshot(i, vars, stack, `cout: ${out}`);
        i++;
        continue;
      }

      // --- variable declaration with assignment ---
      // e.g. int x = 5; or int arr[] = {1,2,3};
      const declMatch = line.match(/^(?:const\s+)?([a-zA-Z_]\w*(?:\s*\*)?)\s+(\w+)(?:\[\d*\])?\s*=\s*(.+?);?$/);
      if (declMatch && C_TYPES.has(declMatch[1].trim())) {
        const varName = declMatch[2];
        let rhs = declMatch[3].replace(/;$/, '').trim();
        let val;
        if (rhs.startsWith('{') && rhs.endsWith('}')) {
          val = rhs.slice(1, -1).split(',').map(v => evalCExpr(v.trim(), vars));
        } else {
          val = evalCExpr(rhs, vars);
        }
        vars[varName] = val;
        this.snapshot(i, vars, stack, `Declare: ${varName} = ${JSON.stringify(val)}`);
        i++;
        continue;
      }

      // --- declaration without assignment ---
      const declNoAssign = line.match(/^(?:const\s+)?([a-zA-Z_]\w*)\s+(\w+)(?:\[(\d+)\])?\s*;?$/);
      if (declNoAssign && C_TYPES.has(declNoAssign[1].trim())) {
        const varName = declNoAssign[2];
        const arrSize = declNoAssign[3];
        vars[varName] = arrSize ? new Array(parseInt(arrSize)).fill(0) : 0;
        this.snapshot(i, vars, stack, `Declare: ${varName}`);
        i++;
        continue;
      }

      // --- assignment (not declaration) ---
      const assignMatch = line.match(/^(\w+)\s*=\s*(.+?);?$/);
      if (assignMatch && assignMatch[1] !== 'return') {
        const varName = assignMatch[1];
        const val = evalCExpr(assignMatch[2].replace(/;$/, ''), vars);
        vars[varName] = val;
        this.snapshot(i, vars, stack, `Assign: ${varName} = ${JSON.stringify(val)}`);
        i++;
        continue;
      }

      // --- augmented assignment ---
      const augMatch = line.match(/^(\w+)\s*(\+=|-=|\*=|\/=|%=)\s*(.+?);?$/);
      if (augMatch) {
        const varName = augMatch[1];
        const op = augMatch[2];
        const rhs = evalCExpr(augMatch[3].replace(/;$/, ''), vars);
        const cur = vars[varName] !== undefined ? vars[varName] : 0;
        switch (op) {
          case '+=': vars[varName] = cur + rhs; break;
          case '-=': vars[varName] = cur - rhs; break;
          case '*=': vars[varName] = cur * rhs; break;
          case '/=': vars[varName] = rhs !== 0 ? Math.trunc(cur / rhs) : 0; break;
          case '%=': vars[varName] = cur % rhs; break;
        }
        this.snapshot(i, vars, stack, `${varName} ${op} ${rhs} → ${vars[varName]}`);
        i++;
        continue;
      }

      // --- increment/decrement ---
      const incMatch = line.match(/^(\w+)(\+\+|--).*$/);
      if (incMatch) {
        const varName = incMatch[1];
        const op = incMatch[2];
        if (varName in vars) {
          vars[varName] = op === '++' ? vars[varName] + 1 : vars[varName] - 1;
          this.snapshot(i, vars, stack, `${varName}${op} → ${vars[varName]}`);
        }
        i++;
        continue;
      }

      // --- array indexed assignment ---
      const idxAssignMatch = line.match(/^(\w+)\[(.+)\]\s*=\s*(.+?);?$/);
      if (idxAssignMatch) {
        const arrName = idxAssignMatch[1];
        const idx = evalCExpr(idxAssignMatch[2], vars);
        const val = evalCExpr(idxAssignMatch[3].replace(/;$/, ''), vars);
        if (Array.isArray(vars[arrName]) && typeof idx === 'number') {
          vars[arrName][idx] = val;
          this.snapshot(i, vars, stack, `${arrName}[${idx}] = ${JSON.stringify(val)}`);
        }
        i++;
        continue;
      }

      // default
      this.snapshot(i, vars, stack, `Execute: ${line}`);
      i++;
    }
  }

  _applyUpdate(expr, vars) {
    const incMatch = expr.match(/^(\w+)(\+\+|--)$/);
    if (incMatch) {
      const varName = incMatch[1];
      vars[varName] = incMatch[2] === '++' ? vars[varName] + 1 : vars[varName] - 1;
      return;
    }
    const augMatch = expr.match(/^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
    if (augMatch) {
      const varName = augMatch[1];
      const rhs = evalCExpr(augMatch[3], vars);
      switch (augMatch[2]) {
        case '+=': vars[varName] += rhs; break;
        case '-=': vars[varName] -= rhs; break;
        case '*=': vars[varName] *= rhs; break;
        case '/=': vars[varName] = Math.trunc(vars[varName] / rhs); break;
      }
    }
  }

  _findBlockEnd(startIdx, parentIndent) {
    let braceDepth = 0;
    let i = startIdx;
    // Find opening brace if not already inside block
    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      if (line === '') { i++; continue; }
      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      braceDepth += openCount - closeCount;
      if (braceDepth < 0) return i;
      if (openCount > 0 && braceDepth === 0) return i + 1;
      i++;
    }
    return i;
  }

  _skipElseChain(fromIdx, indent) {
    let i = fromIdx;
    while (i < this.lines.length) {
      const line = (this.lines[i] || '').trim();
      if (line.startsWith('else')) {
        const end = this._findBlockEnd(i + 1, indent);
        i = end + 1;
      } else break;
    }
    return i;
  }
}

function simulate(code) {
  try {
    const sim = new CSimulator(code);
    const snapshots = sim.simulate();
    return { snapshots, output: sim.output, error: null };
  } catch (err) {
    return { snapshots: [], output: [], error: err.message };
  }
}

module.exports = { simulate };
