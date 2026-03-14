'use strict';

/**
 * Python execution simulator.
 * Parses a subset of Python and produces step-by-step snapshots without
 * executing real code.
 */

function parsePythonValue(raw) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (s === 'True') return true;
  if (s === 'False') return false;
  if (s === 'None') return null;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map(x => parsePythonValue(x.trim()));
  }
  const n = Number(s);
  if (!isNaN(n) && s !== '') return n;
  return s;
}

function evalSimpleExpr(expr, vars) {
  const s = expr.trim();
  // range(n) or range(a,b) or range(a,b,c)
  const rangeMatch = s.match(/^range\(([^)]+)\)$/);
  if (rangeMatch) {
    const parts = rangeMatch[1].split(',').map(p => evalSimpleExpr(p.trim(), vars));
    if (parts.length === 1) {
      const arr = [];
      for (let i = 0; i < parts[0]; i++) arr.push(i);
      return arr;
    }
    if (parts.length === 2) {
      const arr = [];
      for (let i = parts[0]; i < parts[1]; i++) arr.push(i);
      return arr;
    }
    if (parts.length === 3) {
      const arr = [];
      for (let i = parts[0]; parts[2] > 0 ? i < parts[1] : i > parts[1]; i += parts[2]) arr.push(i);
      return arr;
    }
  }
  // list literal
  if (s.startsWith('[') && s.endsWith(']')) return parsePythonValue(s);
  // string literals
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  // boolean / None
  if (s === 'True') return true;
  if (s === 'False') return false;
  if (s === 'None') return null;
  // variable lookup
  if (/^[a-zA-Z_]\w*$/.test(s) && s in vars) return vars[s];
  // indexed variable e.g. arr[i]
  const idxMatch = s.match(/^([a-zA-Z_]\w*)\[(.+)\]$/);
  if (idxMatch) {
    const arr = vars[idxMatch[1]];
    const idx = evalSimpleExpr(idxMatch[2], vars);
    if (Array.isArray(arr) && typeof idx === 'number') return arr[idx];
  }
  // len(x)
  const lenMatch = s.match(/^len\(([^)]+)\)$/);
  if (lenMatch) {
    const val = evalSimpleExpr(lenMatch[1].trim(), vars);
    if (Array.isArray(val) || typeof val === 'string') return val.length;
    return 0;
  }
  // arithmetic: try simple two-operand expressions
  const arithMatch = s.match(/^(.+?)\s*([+\-*\/\/%])\s*(.+)$/);
  if (arithMatch) {
    const left = evalSimpleExpr(arithMatch[1].trim(), vars);
    const op = arithMatch[2];
    const right = evalSimpleExpr(arithMatch[3].trim(), vars);
    if (typeof left === 'number' && typeof right === 'number') {
      switch (op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? left / right : 'ZeroDivisionError';
        case '%': return left % right;
      }
    }
    if (op === '+' && typeof left === 'string') return String(left) + String(right);
  }
  const num = Number(s);
  if (!isNaN(num) && s !== '') return num;
  return s;
}

function evalCondition(cond, vars) {
  const s = cond.trim();
  const compMatch = s.match(/^(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
  if (compMatch) {
    const left = evalSimpleExpr(compMatch[1].trim(), vars);
    const op = compMatch[2];
    const right = evalSimpleExpr(compMatch[3].trim(), vars);
    switch (op) {
      case '==': return left == right; // eslint-disable-line eqeqeq
      case '!=': return left != right; // eslint-disable-line eqeqeq
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
    }
  }
  if (s === 'True') return true;
  if (s === 'False') return false;
  const val = evalSimpleExpr(s, vars);
  return Boolean(val);
}

function getIndent(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

class PythonSimulator {
  constructor(code) {
    this.lines = code.split('\n');
    this.snapshots = [];
    this.stepCount = 0;
    this.output = [];
    this.maxSteps = 200;
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
    const globalVars = {};
    const globalStack = [{ name: '<module>', variables: globalVars, line: 0 }];
    this._execBlock(0, this.lines.length, 0, globalVars, globalStack);
    return this.snapshots;
  }

  _execBlock(startIdx, endIdx, baseIndent, vars, stack) {
    let i = startIdx;
    while (i < endIdx && this.stepCount < this.maxSteps) {
      const rawLine = this.lines[i];
      if (rawLine === undefined) break;
      const line = rawLine.trim();

      // skip blank lines and comments
      if (line === '' || line.startsWith('#')) { i++; continue; }

      const indent = getIndent(rawLine);
      if (indent < baseIndent) break;
      if (indent > baseIndent) { i++; continue; }

      // --- for loop ---
      const forMatch = line.match(/^for\s+(\w+)\s+in\s+(.+):$/);
      if (forMatch) {
        const iterVar = forMatch[1];
        const iterableExpr = forMatch[2];
        const iterable = evalSimpleExpr(iterableExpr, vars);
        const iterArr = Array.isArray(iterable) ? iterable : [];
        this.snapshot(i, vars, stack, `Start for loop: ${line}`);
        const bodyStart = i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        for (const val of iterArr) {
          if (this.stepCount >= this.maxSteps) break;
          vars[iterVar] = val;
          this.snapshot(i, vars, stack, `Loop iteration: ${iterVar} = ${JSON.stringify(val)}`);
          this._execBlock(bodyStart, bodyEnd, indent + 4, vars, stack);
        }
        i = bodyEnd;
        continue;
      }

      // --- while loop ---
      const whileMatch = line.match(/^while\s+(.+):$/);
      if (whileMatch) {
        const cond = whileMatch[1];
        this.snapshot(i, vars, stack, `While condition: ${cond}`);
        const bodyStart = i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        let iterations = 0;
        while (evalCondition(cond, vars) && this.stepCount < this.maxSteps && iterations < 50) {
          iterations++;
          this.snapshot(i, vars, stack, `While true: ${cond}`);
          this._execBlock(bodyStart, bodyEnd, indent + 4, vars, stack);
        }
        this.snapshot(i, vars, stack, `While ended: ${cond} is false`);
        i = bodyEnd;
        continue;
      }

      // --- if/elif/else ---
      const ifMatch = line.match(/^(if|elif)\s+(.+):$/);
      if (ifMatch) {
        const cond = ifMatch[2];
        const result = evalCondition(cond, vars);
        this.snapshot(i, vars, stack, `${ifMatch[1]} condition: ${cond} → ${result}`);
        const bodyStart = i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        if (result) {
          this._execBlock(bodyStart, bodyEnd, indent + 4, vars, stack);
          // skip elif/else chains
          let j = bodyEnd;
          while (j < this.lines.length) {
            const nextLine = this.lines[j].trim();
            const nextIndent = getIndent(this.lines[j]);
            if (nextIndent === indent && (nextLine.startsWith('elif') || nextLine.startsWith('else'))) {
              const skipEnd = this._findBlockEnd(j + 1, indent);
              j = skipEnd;
            } else break;
          }
          i = j;
        } else {
          i = bodyEnd;
        }
        continue;
      }

      const elseMatch = line.match(/^else:$/);
      if (elseMatch) {
        this.snapshot(i, vars, stack, `else branch`);
        const bodyStart = i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        this._execBlock(bodyStart, bodyEnd, indent + 4, vars, stack);
        i = bodyEnd;
        continue;
      }

      // --- function definition ---
      const defMatch = line.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:$/);
      if (defMatch) {
        const funcName = defMatch[1];
        const params = defMatch[2].split(',').map(p => p.trim()).filter(Boolean);
        vars[funcName] = { __type: 'function', name: funcName, params, bodyStart: i + 1, indent };
        this.snapshot(i, vars, stack, `Define function: ${funcName}(${params.join(', ')})`);
        const bodyEnd = this._findBlockEnd(i + 1, indent);
        i = bodyEnd;
        continue;
      }

      // --- return ---
      const returnMatch = line.match(/^return\s*(.*)$/);
      if (returnMatch) {
        const retVal = returnMatch[1] ? evalSimpleExpr(returnMatch[1], vars) : null;
        vars['__return__'] = retVal;
        this.snapshot(i, vars, stack, `Return: ${JSON.stringify(retVal)}`);
        i++;
        break;
      }

      // --- print ---
      const printMatch = line.match(/^print\s*\((.+)\)$/);
      if (printMatch) {
        const arg = evalSimpleExpr(printMatch[1].trim(), vars);
        const out = arg === null ? 'None' : String(arg);
        this.output.push(out);
        this.snapshot(i, vars, stack, `print: ${out}`);
        i++;
        continue;
      }

      // --- augmented assignment (+=, -=, *=, /=) ---
      const augMatch = line.match(/^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
      if (augMatch) {
        const varName = augMatch[1];
        const op = augMatch[2];
        const rhs = evalSimpleExpr(augMatch[3], vars);
        const cur = vars[varName] !== undefined ? vars[varName] : 0;
        switch (op) {
          case '+=': vars[varName] = cur + rhs; break;
          case '-=': vars[varName] = cur - rhs; break;
          case '*=': vars[varName] = cur * rhs; break;
          case '/=': vars[varName] = cur / rhs; break;
        }
        this.snapshot(i, vars, stack, `${varName} ${op} ${rhs} → ${vars[varName]}`);
        i++;
        continue;
      }

      // --- indexed assignment arr[i] = val ---
      const idxAssignMatch = line.match(/^(\w+)\[(.+)\]\s*=\s*(.+)$/);
      if (idxAssignMatch) {
        const arrName = idxAssignMatch[1];
        const idx = evalSimpleExpr(idxAssignMatch[2], vars);
        const val = evalSimpleExpr(idxAssignMatch[3], vars);
        if (Array.isArray(vars[arrName]) && typeof idx === 'number') {
          vars[arrName][idx] = val;
          this.snapshot(i, vars, stack, `${arrName}[${idx}] = ${JSON.stringify(val)}`);
        }
        i++;
        continue;
      }

      // --- simple assignment ---
      const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const rhs = evalSimpleExpr(assignMatch[2], vars);
        vars[varName] = rhs;
        this.snapshot(i, vars, stack, `Assign: ${varName} = ${JSON.stringify(rhs)}`);
        i++;
        continue;
      }

      // --- function call (standalone, e.g. my_func(x)) ---
      const callMatch = line.match(/^(\w+)\s*\(([^)]*)\)$/);
      if (callMatch) {
        const funcName = callMatch[1];
        if (vars[funcName] && vars[funcName].__type === 'function') {
          const func = vars[funcName];
          const argVals = callMatch[2].split(',').map(a => evalSimpleExpr(a.trim(), vars)).filter((_, idx2) => callMatch[2].trim() !== '' || idx2 === -1);
          const frameVars = {};
          func.params.forEach((p, idx2) => { if (argVals[idx2] !== undefined) frameVars[p] = argVals[idx2]; });
          const frame = { name: funcName, variables: frameVars, line: i + 1 };
          stack.push(frame);
          this.snapshot(i, vars, stack, `Call function: ${funcName}(${argVals.join(', ')})`);
          const bodyEnd = this._findBlockEnd(func.bodyStart, func.indent);
          this._execBlock(func.bodyStart, bodyEnd, func.indent + 4, frameVars, stack);
          stack.pop();
          this.snapshot(i, vars, stack, `Return from: ${funcName}`);
        } else {
          this.snapshot(i, vars, stack, `Call: ${line}`);
        }
        i++;
        continue;
      }

      // default: record the line
      this.snapshot(i, vars, stack, `Execute: ${line}`);
      i++;
    }
  }

  _findBlockEnd(startIdx, parentIndent) {
    let i = startIdx;
    while (i < this.lines.length) {
      const line = this.lines[i];
      if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue; }
      const ind = getIndent(line);
      if (ind <= parentIndent) break;
      i++;
    }
    return i;
  }
}

function simulate(code) {
  try {
    const sim = new PythonSimulator(code);
    const snapshots = sim.simulate();
    return { snapshots, output: sim.output, error: null };
  } catch (err) {
    return { snapshots: [], output: [], error: err.message };
  }
}

module.exports = { simulate };
