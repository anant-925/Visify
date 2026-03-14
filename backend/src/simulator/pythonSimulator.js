'use strict';

/**
 * Python execution simulator.
 * Parses a subset of Python and produces step-by-step snapshots without
 * executing real code.
 */

function getIndent(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

/** Split a comma-separated argument list, respecting nested brackets/parens. */
function splitArgs(s) {
  const args = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

/** Parse a raw Python literal (no variable lookup). */
function parseLiteral(raw) {
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
    return splitArgs(inner).map(x => parseLiteral(x));
  }
  const n = Number(s);
  if (!isNaN(n) && s !== '') return n;
  return s;
}

class PythonSimulator {
  constructor(code) {
    this.lines = code.split('\n');
    this.snapshots = [];
    this.stepCount = 0;
    this.output = [];
    this.maxSteps = 500;
    // global function registry (shared across all frames)
    this.functions = {};
    // set to true when a return statement fires; cleared by _callFunction
    this._returning = false;
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

  // ─── expression evaluator ────────────────────────────────────────────────

  /**
   * Evaluate an expression string in the context of `vars` and `stack`.
   * Supports: literals, variables, arithmetic (+−×÷//%), comparison,
   * boolean (and/or/not), slices arr[a:b], indexing arr[i], len(),
   * range(), list concat, and user-defined function calls.
   * Returns SENTINEL_CALL when a function was executed and its return
   * value is stored in vars.__return__.
   */
  _evalExpr(expr, vars, stack, lineIdx) {
    const s = expr.trim();

    // ── boolean operators (lowest precedence, split right-to-left) ──
    // Split on ' or ' outside brackets
    const orIdx = this._findBinaryOp(s, ' or ');
    if (orIdx !== -1) {
      const left = this._evalExpr(s.slice(0, orIdx).trim(), vars, stack, lineIdx);
      if (left) return left;
      return this._evalExpr(s.slice(orIdx + 4).trim(), vars, stack, lineIdx);
    }
    const andIdx = this._findBinaryOp(s, ' and ');
    if (andIdx !== -1) {
      const left = this._evalExpr(s.slice(0, andIdx).trim(), vars, stack, lineIdx);
      if (!left) return left;
      return this._evalExpr(s.slice(andIdx + 5).trim(), vars, stack, lineIdx);
    }
    if (s.startsWith('not ')) {
      return !this._evalExpr(s.slice(4).trim(), vars, stack, lineIdx);
    }

    // ── comparison operators ──
    const CMP_OPS = ['==', '!=', '<=', '>=', '<', '>'];
    for (const op of CMP_OPS) {
      const idx = this._findBinaryOp(s, op);
      if (idx !== -1) {
        const left = this._evalExpr(s.slice(0, idx).trim(), vars, stack, lineIdx);
        const right = this._evalExpr(s.slice(idx + op.length).trim(), vars, stack, lineIdx);
        switch (op) {
          case '==': return left == right; // eslint-disable-line eqeqeq
          case '!=': return left != right; // eslint-disable-line eqeqeq
          case '<':  return left < right;
          case '>':  return left > right;
          case '<=': return left <= right;
          case '>=': return left >= right;
        }
      }
    }

    // ── additive operators (+, -) ──
    const addIdx = this._findBinaryOp(s, '+');
    if (addIdx !== -1) {
      const left = this._evalExpr(s.slice(0, addIdx).trim(), vars, stack, lineIdx);
      const right = this._evalExpr(s.slice(addIdx + 1).trim(), vars, stack, lineIdx);
      if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right];
      if (typeof left === 'string' || typeof right === 'string') return String(left) + String(right);
      if (typeof left === 'number' && typeof right === 'number') return left + right;
      return String(left) + String(right);
    }
    const subIdx = this._findBinaryOp(s, '-', true /* skip unary */);
    if (subIdx !== -1) {
      const left = this._evalExpr(s.slice(0, subIdx).trim(), vars, stack, lineIdx);
      const right = this._evalExpr(s.slice(subIdx + 1).trim(), vars, stack, lineIdx);
      if (typeof left === 'number' && typeof right === 'number') return left - right;
    }

    // ── multiplicative operators (*, //, /, %) ──
    const floorIdx = this._findBinaryOp(s, '//');
    if (floorIdx !== -1) {
      const left = this._evalExpr(s.slice(0, floorIdx).trim(), vars, stack, lineIdx);
      const right = this._evalExpr(s.slice(floorIdx + 2).trim(), vars, stack, lineIdx);
      if (typeof left === 'number' && typeof right === 'number' && right !== 0) {
        return Math.floor(left / right);
      }
    }
    const mulIdx = this._findBinaryOp(s, '*');
    if (mulIdx !== -1) {
      const left = this._evalExpr(s.slice(0, mulIdx).trim(), vars, stack, lineIdx);
      const right = this._evalExpr(s.slice(mulIdx + 1).trim(), vars, stack, lineIdx);
      if (typeof left === 'number' && typeof right === 'number') return left * right;
    }
    const divIdx = this._findBinaryOp(s, '/');
    if (divIdx !== -1) {
      const left = this._evalExpr(s.slice(0, divIdx).trim(), vars, stack, lineIdx);
      const right = this._evalExpr(s.slice(divIdx + 1).trim(), vars, stack, lineIdx);
      if (typeof right === 'number' && right !== 0) return left / right;
      return 'ZeroDivisionError';
    }
    const modIdx = this._findBinaryOp(s, '%');
    if (modIdx !== -1) {
      const left = this._evalExpr(s.slice(0, modIdx).trim(), vars, stack, lineIdx);
      const right = this._evalExpr(s.slice(modIdx + 1).trim(), vars, stack, lineIdx);
      if (typeof left === 'number' && typeof right === 'number') return left % right;
    }

    // ── unary minus ──
    if (s.startsWith('-')) {
      const val = this._evalExpr(s.slice(1).trim(), vars, stack, lineIdx);
      if (typeof val === 'number') return -val;
    }

    // ── parenthesised sub-expression ──
    if (s.startsWith('(') && s.endsWith(')')) {
      return this._evalExpr(s.slice(1, -1), vars, stack, lineIdx);
    }

    // ── list literal ──
    if (s.startsWith('[') && s.endsWith(']')) {
      const inner = s.slice(1, -1).trim();
      if (inner === '') return [];
      return splitArgs(inner).map(a => this._evalExpr(a, vars, stack, lineIdx));
    }

    // ── string literals ──
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }

    // ── boolean / None literals ──
    if (s === 'True') return true;
    if (s === 'False') return false;
    if (s === 'None') return null;

    // ── numeric literal ──
    const num = Number(s);
    if (!isNaN(num) && s !== '') return num;

    // ── slice: name[a:b] or name[a:] or name[:b] ──
    const sliceMatch = s.match(/^([a-zA-Z_]\w*)\[([^[\]]*):([^[\]]*)\]$/);
    if (sliceMatch) {
      const arrVal = vars[sliceMatch[1]];
      if (Array.isArray(arrVal) || typeof arrVal === 'string') {
        const len = arrVal.length;
        const start = sliceMatch[2].trim() === '' ? 0
          : this._evalExpr(sliceMatch[2].trim(), vars, stack, lineIdx);
        const end = sliceMatch[3].trim() === '' ? len
          : this._evalExpr(sliceMatch[3].trim(), vars, stack, lineIdx);
        return typeof arrVal === 'string'
          ? arrVal.slice(start, end)
          : arrVal.slice(start, end);
      }
      return [];
    }

    // ── index: name[expr] ──
    const idxMatch = s.match(/^([a-zA-Z_]\w*)\[(.+)\]$/);
    if (idxMatch) {
      const arrVal = vars[idxMatch[1]];
      const idx = this._evalExpr(idxMatch[2], vars, stack, lineIdx);
      if ((Array.isArray(arrVal) || typeof arrVal === 'string') && typeof idx === 'number') {
        return arrVal[idx];
      }
    }

    // ── built-in functions ──
    const rangeMatch = s.match(/^range\((.+)\)$/);
    if (rangeMatch) {
      const parts = splitArgs(rangeMatch[1]).map(p => this._evalExpr(p, vars, stack, lineIdx));
      const result = [];
      if (parts.length === 1) { for (let i = 0; i < parts[0]; i++) result.push(i); }
      else if (parts.length === 2) { for (let i = parts[0]; i < parts[1]; i++) result.push(i); }
      else if (parts.length === 3) {
        for (let i = parts[0]; parts[2] > 0 ? i < parts[1] : i > parts[1]; i += parts[2]) result.push(i);
      }
      return result;
    }

    const lenMatch = s.match(/^len\((.+)\)$/);
    if (lenMatch) {
      const val = this._evalExpr(lenMatch[1].trim(), vars, stack, lineIdx);
      if (Array.isArray(val) || typeof val === 'string') return val.length;
      return 0;
    }

    const strMatch = s.match(/^str\((.+)\)$/);
    if (strMatch) {
      const val = this._evalExpr(strMatch[1].trim(), vars, stack, lineIdx);
      return String(val);
    }

    const intMatch = s.match(/^int\((.+)\)$/);
    if (intMatch) {
      return Math.trunc(Number(this._evalExpr(intMatch[1].trim(), vars, stack, lineIdx)));
    }

    // ── method call on array: arr.copy(), arr.index() ──
    const methodExprMatch = s.match(/^([a-zA-Z_]\w*)\.(\w+)\(([^]*)\)$/);
    if (methodExprMatch) {
      const objVal = vars[methodExprMatch[1]];
      const method = methodExprMatch[2];
      const argStr = methodExprMatch[3].trim();
      const argVals = argStr === '' ? [] : splitArgs(argStr).map(a => this._evalExpr(a, vars, stack, lineIdx));
      if (Array.isArray(objVal)) {
        if (method === 'copy') return [...objVal];
        if (method === 'index') return objVal.indexOf(argVals[0]);
        if (method === 'count') return objVal.filter(x => x === argVals[0]).length;
      }
      if (typeof objVal === 'string') {
        if (method === 'upper') return objVal.toUpperCase();
        if (method === 'lower') return objVal.toLowerCase();
        if (method === 'split') return argVals.length ? objVal.split(argVals[0]) : objVal.split(' ');
      }
    }

    // ── user-defined function call: name(args) ──
    const callMatch = s.match(/^([a-zA-Z_]\w*)\(([^]*)\)$/);
    if (callMatch) {
      const funcName = callMatch[1];
      const func = this.functions[funcName] || (vars[funcName] && vars[funcName].__type === 'function' ? vars[funcName] : null);
      if (func) {
        const rawArgs = callMatch[2].trim();
        const argVals = rawArgs === '' ? [] : splitArgs(rawArgs).map(a => this._evalExpr(a, vars, stack, lineIdx));
        return this._callFunction(func, argVals, stack, lineIdx);
      }
    }

    // ── plain variable ──
    if (/^[a-zA-Z_]\w*$/.test(s) && s in vars) return vars[s];

    // ── fallback: return as-is ──
    return s;
  }

  /** Find the outermost (depth-0) position of `op` in `s`, right-to-left for left-assoc. */
  _findBinaryOp(s, op, skipLeading = false) {
    let depth = 0;
    const start = skipLeading ? 1 : 0;
    // Start from the very end so bracket depth is correctly tracked for all chars
    for (let i = s.length - 1; i >= start; i--) {
      const ch = s[i];
      // Going right-to-left: closing brackets open a new scope, opening brackets close one
      if (')]}'.includes(ch)) depth++;
      else if ('([{'.includes(ch)) depth--;
      // Only check for the operator when we're at depth 0 and enough room remains
      if (depth === 0 && i + op.length <= s.length && s.slice(i, i + op.length) === op) {
        // For single-char ops, make sure we don't accidentally split a compound op
        if (op.length === 1) {
          if (op === '/' && s[i + 1] === '/') continue; // skip //
          if (op === '*' && s[i + 1] === '*') continue; // skip **
          if (op === '-' && i === 0) continue;          // unary minus at start
          // Don't match the right char of <=, >=, ==, !=
          if ('=<>!'.includes(s[i - 1] || '')) continue;
        }
        return i;
      }
    }
    return -1;
  }

  /** Evaluate a condition (boolean context). */
  _evalCond(cond, vars, stack, lineIdx) {
    const val = this._evalExpr(cond, vars, stack, lineIdx);
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (Array.isArray(val)) return val.length > 0;
    if (val === null || val === undefined) return false;
    return Boolean(val);
  }

  /** Invoke a user-defined function, push/pop stack frame, return its return value. */
  _callFunction(func, argVals, stack, lineIdx) {
    const frameVars = {};
    func.params.forEach((p, i) => { if (argVals[i] !== undefined) frameVars[p] = argVals[i]; });
    const frame = { name: func.name, variables: frameVars, line: lineIdx + 1 };
    stack.push(frame);
    this.snapshot(lineIdx, frameVars, stack, `Call ${func.name}(${argVals.map(a => JSON.stringify(a)).join(', ')})`);
    const bodyEnd = this._findBlockEnd(func.bodyStart, func.indent);
    this._execBlock(func.bodyStart, bodyEnd, func.indent + 4, frameVars, stack);
    // Clear the return signal so the caller's _execBlock can continue
    this._returning = false;
    stack.pop();
    const retVal = frameVars['__return__'] !== undefined ? frameVars['__return__'] : null;
    this.snapshot(lineIdx, stack.length > 0 ? stack[stack.length - 1].variables : frameVars, stack, `Return from ${func.name} → ${JSON.stringify(retVal)}`);
    return retVal;
  }

  // ─── statement executor ──────────────────────────────────────────────────

  _execBlock(startIdx, endIdx, baseIndent, vars, stack) {
    let i = startIdx;
    while (i < endIdx && this.stepCount < this.maxSteps && !this._returning) {
      const rawLine = this.lines[i];
      if (rawLine === undefined) break;
      const line = rawLine.trim();

      // skip blank lines and comments
      if (line === '' || line.startsWith('#')) { i++; continue; }

      const indent = getIndent(rawLine);
      if (indent < baseIndent) break;
      if (indent > baseIndent) { i++; continue; }

      // --- function definition ---
      const defMatch = line.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:$/);
      if (defMatch) {
        const funcName = defMatch[1];
        const params = defMatch[2].split(',').map(p => p.trim()).filter(Boolean);
        const funcObj = { __type: 'function', name: funcName, params, bodyStart: i + 1, indent };
        vars[funcName] = funcObj;
        // register globally so recursive calls from inner frames can find it
        this.functions[funcName] = funcObj;
        this.snapshot(i, vars, stack, `Define function: ${funcName}(${params.join(', ')})`);
        i = this._findBlockEnd(i + 1, indent);
        continue;
      }

      // --- for loop ---
      const forMatch = line.match(/^for\s+(\w+)\s+in\s+(.+):$/);
      if (forMatch) {
        const iterVar = forMatch[1];
        const iterable = this._evalExpr(forMatch[2], vars, stack, i);
        const iterArr = Array.isArray(iterable) ? iterable : [];
        this.snapshot(i, vars, stack, `for ${iterVar} in [${iterArr.join(', ')}]`);
        const bodyStart = i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        for (const val of iterArr) {
          if (this.stepCount >= this.maxSteps) break;
          vars[iterVar] = val;
          this.snapshot(i, vars, stack, `Loop: ${iterVar} = ${JSON.stringify(val)}`);
          this._execBlock(bodyStart, bodyEnd, indent + 4, vars, stack);
        }
        i = bodyEnd;
        continue;
      }

      // --- while loop ---
      const whileMatch = line.match(/^while\s+(.+):$/);
      if (whileMatch) {
        const cond = whileMatch[1];
        this.snapshot(i, vars, stack, `while ${cond}`);
        const bodyStart = i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        let iterations = 0;
        while (this._evalCond(cond, vars, stack, i) && this.stepCount < this.maxSteps && iterations < 100) {
          iterations++;
          this.snapshot(i, vars, stack, `While true: ${cond}`);
          this._execBlock(bodyStart, bodyEnd, indent + 4, vars, stack);
        }
        this.snapshot(i, vars, stack, `While ended: ${cond} → false`);
        i = bodyEnd;
        continue;
      }

      // --- if/elif/else ---
      const ifMatch = line.match(/^(if|elif)\s+(.+):$/);
      if (ifMatch) {
        const cond = ifMatch[2];
        const result = this._evalCond(cond, vars, stack, i);
        this.snapshot(i, vars, stack, `${ifMatch[1]} ${cond} → ${result}`);
        const bodyStart = i + 1;
        const bodyEnd = this._findBlockEnd(bodyStart, indent);
        if (result) {
          this._execBlock(bodyStart, bodyEnd, indent + 4, vars, stack);
          let j = bodyEnd;
          while (j < this.lines.length) {
            const nxt = this.lines[j].trim();
            if (getIndent(this.lines[j]) === indent && (nxt.startsWith('elif') || nxt.startsWith('else'))) {
              j = this._findBlockEnd(j + 1, indent);
            } else break;
          }
          i = j;
        } else {
          i = bodyEnd;
        }
        continue;
      }

      if (line === 'else:') {
        this.snapshot(i, vars, stack, `else branch`);
        const bodyEnd = this._findBlockEnd(i + 1, indent);
        this._execBlock(i + 1, bodyEnd, indent + 4, vars, stack);
        i = bodyEnd;
        continue;
      }

      // --- return ---
      const returnMatch = line.match(/^return\s*(.*)$/);
      if (returnMatch) {
        const retVal = returnMatch[1].trim()
          ? this._evalExpr(returnMatch[1].trim(), vars, stack, i)
          : null;
        vars['__return__'] = retVal;
        this.snapshot(i, vars, stack, `return ${JSON.stringify(retVal)}`);
        // Signal all enclosing _execBlock frames to unwind to the function boundary
        this._returning = true;
        return;
      }

      // --- print ---
      const printMatch = line.match(/^print\s*\((.+)\)$/);
      if (printMatch) {
        const arg = this._evalExpr(printMatch[1].trim(), vars, stack, i);
        const out = arg === null ? 'None' : Array.isArray(arg) ? JSON.stringify(arg) : String(arg);
        this.output.push(out);
        this.snapshot(i, vars, stack, `print → ${out}`);
        i++;
        continue;
      }

      // --- augmented assignment (+=, -=, *=, /=, //=) ---
      const augMatch = line.match(/^(\w+)\s*(\/\/=|\+=|-=|\*=|\/=|%=)\s*(.+)$/);
      if (augMatch) {
        const varName = augMatch[1];
        const op = augMatch[2];
        const rhs = this._evalExpr(augMatch[3], vars, stack, i);
        const cur = vars[varName] !== undefined ? vars[varName] : 0;
        switch (op) {
          case '+=':  vars[varName] = Array.isArray(cur) ? [...cur, ...(Array.isArray(rhs) ? rhs : [rhs])] : cur + rhs; break;
          case '-=':  vars[varName] = cur - rhs; break;
          case '*=':  vars[varName] = cur * rhs; break;
          case '/=':  vars[varName] = rhs !== 0 ? cur / rhs : 'ZeroDivisionError'; break;
          case '//=': vars[varName] = rhs !== 0 ? Math.floor(cur / rhs) : 'ZeroDivisionError'; break;
          case '%=':  vars[varName] = cur % rhs; break;
        }
        this.snapshot(i, vars, stack, `${varName} ${op} ${JSON.stringify(rhs)} → ${JSON.stringify(vars[varName])}`);
        i++;
        continue;
      }

      // --- tuple assignment: a, b = c, d  or  arr[i], arr[j] = arr[j], arr[i] ---
      // Match exactly two LHS targets separated by a comma, then "=" then two RHS exprs
      const tupleAssignMatch = line.match(/^([^=,]+),\s*([^=,]+)\s*=\s*([^=].*)$/);
      if (tupleAssignMatch && !line.includes('==')) {
        const lhs1Raw = tupleAssignMatch[1].trim();
        const lhs2Raw = tupleAssignMatch[2].trim();
        // Split RHS on the outermost comma
        const rhsStr = tupleAssignMatch[3].trim();
        const commaIdx = this._findBinaryOp(rhsStr, ',');
        if (commaIdx !== -1) {
          const rhs1 = this._evalExpr(rhsStr.slice(0, commaIdx).trim(), vars, stack, i);
          const rhs2 = this._evalExpr(rhsStr.slice(commaIdx + 1).trim(), vars, stack, i);

          const _assign = (lhs, val) => {
            const idxM = lhs.match(/^([a-zA-Z_]\w*)\[(.+)\]$/);
            if (idxM) {
              const arrName = idxM[1];
              const idx = this._evalExpr(idxM[2], vars, stack, i);
              if (Array.isArray(vars[arrName]) && typeof idx === 'number') {
                vars[arrName] = [...vars[arrName]];
                vars[arrName][idx] = val;
              }
            } else if (/^[a-zA-Z_]\w*$/.test(lhs)) {
              vars[lhs] = val;
            }
          };

          _assign(lhs1Raw, rhs1);
          _assign(lhs2Raw, rhs2);
          this.snapshot(i, vars, stack, `${lhs1Raw}, ${lhs2Raw} = ${JSON.stringify(rhs1)}, ${JSON.stringify(rhs2)}`);
          i++;
          continue;
        }
      }

      // --- indexed assignment arr[i] = val ---
      const idxAssignMatch = line.match(/^([a-zA-Z_]\w*)\[(.+)\]\s*=\s*(.+)$/);
      if (idxAssignMatch) {
        const arrName = idxAssignMatch[1];
        const idx = this._evalExpr(idxAssignMatch[2], vars, stack, i);
        const val = this._evalExpr(idxAssignMatch[3], vars, stack, i);
        if (Array.isArray(vars[arrName]) && typeof idx === 'number') {
          vars[arrName] = [...vars[arrName]];
          vars[arrName][idx] = val;
          this.snapshot(i, vars, stack, `${arrName}[${idx}] = ${JSON.stringify(val)}`);
        }
        i++;
        continue;
      }

      // --- simple assignment var = expr ---
      const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const rhs = this._evalExpr(assignMatch[2], vars, stack, i);
        vars[varName] = rhs;
        this.snapshot(i, vars, stack, `${varName} = ${JSON.stringify(rhs)}`);
        i++;
        continue;
      }

      // --- method call: arr.append(val) / arr.pop() / arr.sort() ---
      const methodMatch = line.match(/^([a-zA-Z_]\w*)\.(\w+)\s*\(([^]*)\)$/);
      if (methodMatch) {
        const objName = methodMatch[1];
        const method = methodMatch[2];
        const argStr = methodMatch[3].trim();
        const argVals = argStr === '' ? [] : splitArgs(argStr).map(a => this._evalExpr(a, vars, stack, i));
        if (Array.isArray(vars[objName])) {
          vars[objName] = [...vars[objName]];
          if (method === 'append') {
            vars[objName].push(argVals[0]);
            this.snapshot(i, vars, stack, `${objName}.append(${JSON.stringify(argVals[0])}) → length=${vars[objName].length}`);
          } else if (method === 'pop') {
            const popped = argVals.length ? vars[objName].splice(argVals[0], 1)[0] : vars[objName].pop();
            this.snapshot(i, vars, stack, `${objName}.pop() → ${JSON.stringify(popped)}`);
          } else if (method === 'sort') {
            vars[objName].sort((a, b) => a - b);
            this.snapshot(i, vars, stack, `${objName}.sort() → ${JSON.stringify(vars[objName])}`);
          } else if (method === 'reverse') {
            vars[objName].reverse();
            this.snapshot(i, vars, stack, `${objName}.reverse()`);
          } else {
            this.snapshot(i, vars, stack, `${line}`);
          }
        } else {
          this.snapshot(i, vars, stack, `${line}`);
        }
        i++;
        continue;
      }

      // --- standalone function call ---
      const callMatch = line.match(/^([a-zA-Z_]\w*)\(([^]*)\)$/);
      if (callMatch) {
        const funcName = callMatch[1];
        const func = this.functions[funcName] || (vars[funcName] && vars[funcName].__type === 'function' ? vars[funcName] : null);
        if (func) {
          const rawArgs = callMatch[2].trim();
          const argVals = rawArgs === '' ? [] : splitArgs(rawArgs).map(a => this._evalExpr(a, vars, stack, i));
          this._callFunction(func, argVals, stack, i);
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
      if (getIndent(line) <= parentIndent) break;
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
