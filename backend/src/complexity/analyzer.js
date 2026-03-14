'use strict';

/**
 * Complexity Analyzer
 * Inspects code structure to determine time/space complexity.
 */

function countLoopNesting(code, language) {
  const lines = code.split('\n');
  let maxDepth = 0;
  let currentDepth = 0;
  const loopKeywordsPy = /^\s*(for|while)\s+/;
  const loopKeywordsC = /^\s*(for|while)\s*\(/;
  const loopRe = language === 'python' ? loopKeywordsPy : loopKeywordsC;

  for (const line of lines) {
    if (loopRe.test(line)) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    // Simple depth tracking via braces / dedent not needed for pattern detection
  }
  return maxDepth;
}

function detectPattern(code, language) {
  const lower = code.toLowerCase();

  // Fibonacci naive recursion pattern
  if (/def\s+fib|int\s+fib|fibonacci/.test(lower)) {
    if (/return\s+fib\s*\(|return\s+fibonacci\s*\(/.test(lower)) {
      return 'fibonacci_recursion';
    }
  }

  // Generic double recursion (e.g. tree traversal)
  const recursiveCalls = (code.match(/\breturn\b[^;]*\w+\s*\([^)]*\)\s*[+\-*/]\s*\w+\s*\([^)]*\)/g) || []).length;
  if (recursiveCalls > 0) return 'double_recursion';

  // Merge sort / divide and conquer: recursion + merge
  if (/merge_sort|mergesort|divide.*conquer/i.test(code) ||
      (/(left|right|mid|middle)/.test(lower) && /def\s+\w+|void\s+\w+/.test(lower) && /\w+\s*\(.*mid.*\)/.test(lower))) {
    return 'merge_sort';
  }

  // Binary search: half the range each iteration
  if (/binary_search|binarysearch/i.test(code) ||
      (/(low|left|start)\s*=\s*mid|mid\s*=\s*.*(low|left|start)\s*\+/i.test(code))) {
    return 'binary_search';
  }

  // Logarithmic: halving loop
  if (/\/=\s*2|>>=\s*1|\*=\s*2|n\s*\/\s*2/.test(code) && countLoopNesting(code, language) === 1) {
    return 'logarithmic';
  }

  // Nested loops
  const depth = countLoopNesting(code, language);
  if (depth >= 3) return 'triple_nested';
  if (depth === 2) return 'double_nested';
  if (depth === 1) return 'single_loop';

  // Check for recursion (single)
  const funcMatch = code.match(/def\s+(\w+)|(?:int|void|double)\s+(\w+)\s*\(/);
  if (funcMatch) {
    const fname = funcMatch[1] || funcMatch[2];
    if (fname && new RegExp(`\\b${fname}\\s*\\(`).test(code.replace(new RegExp(`def\\s+${fname}|(?:int|void|double)\\s+${fname}`), ''))) {
      return 'linear_recursion';
    }
  }

  return 'constant';
}

const COMPLEXITY_MAP = {
  constant: {
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    bigO: 'O(1)',
    name: 'Constant',
    explanation: 'The algorithm executes a fixed number of operations regardless of input size.',
    recurrenceRelation: null,
    steps: [
      'No loops or recursion detected.',
      'All operations execute in constant time.',
      'Time complexity is O(1).'
    ]
  },
  single_loop: {
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    bigO: 'O(n)',
    name: 'Linear',
    explanation: 'A single loop iterates over input of size n, giving linear time complexity.',
    recurrenceRelation: null,
    steps: [
      'Detected one loop iterating over n elements.',
      'Each iteration performs O(1) work.',
      'Total: n × O(1) = O(n).'
    ]
  },
  double_nested: {
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    bigO: 'O(n²)',
    name: 'Quadratic',
    explanation: 'Two nested loops each iterate over n elements, giving quadratic time complexity.',
    recurrenceRelation: null,
    steps: [
      'Detected two nested loops.',
      'Outer loop: n iterations.',
      'Inner loop: n iterations per outer iteration.',
      'Total: n × n = O(n²).'
    ]
  },
  triple_nested: {
    timeComplexity: 'O(n³)',
    spaceComplexity: 'O(1)',
    bigO: 'O(n³)',
    name: 'Cubic',
    explanation: 'Three nested loops each iterating n times yields cubic time complexity.',
    recurrenceRelation: null,
    steps: [
      'Detected three nested loops.',
      'Each loop iterates n times.',
      'Total: n × n × n = O(n³).'
    ]
  },
  logarithmic: {
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    bigO: 'O(log n)',
    name: 'Logarithmic',
    explanation: 'The loop halves the input size each iteration, typical of binary search.',
    recurrenceRelation: 'T(n) = T(n/2) + O(1)',
    steps: [
      'Loop variable is halved (or doubled) each iteration.',
      'Number of iterations ≈ log₂(n).',
      'Total: O(log n).'
    ]
  },
  binary_search: {
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    bigO: 'O(log n)',
    name: 'Logarithmic (Binary Search)',
    explanation: 'Binary search halves the search space each step.',
    recurrenceRelation: 'T(n) = T(n/2) + O(1)',
    steps: [
      'Binary search pattern detected (mid-point halving).',
      'Search space halves each iteration.',
      'T(n) = T(n/2) + O(1) solves to O(log n) by Master Theorem.'
    ]
  },
  merge_sort: {
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    bigO: 'O(n log n)',
    name: 'Linearithmic (Merge Sort)',
    explanation: 'Divide-and-conquer with O(n) merge step and O(log n) recursion depth.',
    recurrenceRelation: 'T(n) = 2T(n/2) + O(n)',
    steps: [
      'Divide-and-conquer pattern detected.',
      'Array split into two halves recursively: O(log n) levels.',
      'Merging step at each level: O(n).',
      'T(n) = 2T(n/2) + O(n) → O(n log n) by Master Theorem (Case 2).'
    ]
  },
  linear_recursion: {
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    bigO: 'O(n)',
    name: 'Linear Recursion',
    explanation: 'Single recursive call per invocation with O(1) work gives linear time.',
    recurrenceRelation: 'T(n) = T(n-1) + O(1)',
    steps: [
      'Single recursive call per invocation.',
      'T(n) = T(n-1) + O(1).',
      'Solves to O(n).'
    ]
  },
  double_recursion: {
    timeComplexity: 'O(2^n)',
    spaceComplexity: 'O(n)',
    bigO: 'O(2^n)',
    name: 'Exponential',
    explanation: 'Two recursive calls per invocation leads to exponential growth.',
    recurrenceRelation: 'T(n) = 2T(n-1) + O(1)',
    steps: [
      'Two recursive calls per invocation detected.',
      'T(n) = 2T(n-1) + O(1).',
      'Solves to O(2^n).'
    ]
  },
  fibonacci_recursion: {
    timeComplexity: 'O(2^n)',
    spaceComplexity: 'O(n)',
    bigO: 'O(2^n)',
    name: 'Exponential (Fibonacci)',
    explanation: 'Naive Fibonacci recursion with two calls per step yields exponential time.',
    recurrenceRelation: 'T(n) = T(n-1) + T(n-2) + O(1)',
    steps: [
      'Fibonacci recursion pattern detected.',
      'Each call branches into two sub-calls.',
      'T(n) = T(n-1) + T(n-2) + O(1) ≈ O(φ^n) ≈ O(2^n) where φ ≈ 1.618.'
    ]
  }
};

function analyze(code, language = 'python') {
  const pattern = detectPattern(code, language);
  const result = COMPLEXITY_MAP[pattern] || COMPLEXITY_MAP.constant;
  return {
    pattern,
    timeComplexity: result.timeComplexity,
    spaceComplexity: result.spaceComplexity,
    bigO: result.bigO,
    name: result.name,
    explanation: result.explanation,
    recurrenceRelation: result.recurrenceRelation,
    steps: result.steps
  };
}

module.exports = { analyze };
