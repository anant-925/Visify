'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, FlaskConical, ChevronDown, ChevronRight } from 'lucide-react';
import { visualizeCode } from '@/lib/api';

interface TestCase {
  label: string;
  input: string;
  expected: string;
  code: string;
}

interface AlgorithmTests {
  id: string;
  name: string;
  complexity: string;
  color: string;
  cases: TestCase[];
}

const ALGORITHM_TESTS: AlgorithmTests[] = [
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    complexity: 'O(n²)',
    color: 'indigo',
    cases: [
      {
        label: 'Random order',
        input: '[64, 34, 25, 12, 22, 11, 90]',
        expected: '[11, 12, 22, 25, 34, 64, 90]',
        code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
arr = [64, 34, 25, 12, 22, 11, 90]
result = bubble_sort(arr)
print(result)`,
      },
      {
        label: 'Already sorted',
        input: '[1, 2, 3, 4, 5]',
        expected: '[1, 2, 3, 4, 5]',
        code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
arr = [1, 2, 3, 4, 5]
result = bubble_sort(arr)
print(result)`,
      },
      {
        label: 'Reverse sorted',
        input: '[5, 4, 3, 2, 1]',
        expected: '[1, 2, 3, 4, 5]',
        code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
arr = [5, 4, 3, 2, 1]
result = bubble_sort(arr)
print(result)`,
      },
    ],
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    complexity: 'O(log n)',
    color: 'emerald',
    cases: [
      {
        label: 'Target found (index 3)',
        input: 'arr=[1,3,5,7,9,11,13,15], target=7',
        expected: '3',
        code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
arr = [1, 3, 5, 7, 9, 11, 13, 15]
result = binary_search(arr, 7)
print(result)`,
      },
      {
        label: 'Target not found',
        input: 'arr=[1,3,5,7,9], target=6',
        expected: '-1',
        code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
arr = [1, 3, 5, 7, 9]
result = binary_search(arr, 6)
print(result)`,
      },
      {
        label: 'First element',
        input: 'arr=[2,4,6,8,10], target=2',
        expected: '0',
        code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
arr = [2, 4, 6, 8, 10]
result = binary_search(arr, 2)
print(result)`,
      },
    ],
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci (Recursive)',
    complexity: 'O(2ⁿ)',
    color: 'amber',
    cases: [
      {
        label: 'fib(6) = 8',
        input: 'n = 6',
        expected: '8',
        code: `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
result = fib(6)
print(result)`,
      },
      {
        label: 'fib(0) = 0 (base case)',
        input: 'n = 0',
        expected: '0',
        code: `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
result = fib(0)
print(result)`,
      },
      {
        label: 'fib(5) = 5',
        input: 'n = 5',
        expected: '5',
        code: `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
result = fib(5)
print(result)`,
      },
    ],
  },
  {
    id: 'factorial',
    name: 'Factorial (Recursive)',
    complexity: 'O(n)',
    color: 'pink',
    cases: [
      {
        label: '5! = 120',
        input: 'n = 5',
        expected: '120',
        code: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
result = factorial(5)
print(result)`,
      },
      {
        label: '0! = 1 (base case)',
        input: 'n = 0',
        expected: '1',
        code: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
result = factorial(0)
print(result)`,
      },
      {
        label: '10! = 3628800',
        input: 'n = 10',
        expected: '3628800',
        code: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
result = factorial(10)
print(result)`,
      },
    ],
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort',
    complexity: 'O(n log n)',
    color: 'cyan',
    cases: [
      {
        label: 'Mixed array',
        input: '[38, 27, 43, 3]',
        expected: '[3, 27, 38, 43]',
        code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result += [left[i]]
            i += 1
        else:
            result += [right[j]]
            j += 1
    result += left[i:]
    result += right[j:]
    return result

arr = [38, 27, 43, 3]
sorted_arr = merge_sort(arr)
print(sorted_arr)`,
      },
      {
        label: 'Two elements',
        input: '[5, 2]',
        expected: '[2, 5]',
        code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result += [left[i]]
            i += 1
        else:
            result += [right[j]]
            j += 1
    result += left[i:]
    result += right[j:]
    return result

arr = [5, 2]
sorted_arr = merge_sort(arr)
print(sorted_arr)`,
      },
    ],
  },
  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    complexity: 'O(n²)',
    color: 'violet',
    cases: [
      {
        label: 'Random array',
        input: '[12, 11, 13, 5, 6]',
        expected: '[5, 6, 11, 12, 13]',
        code: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr
arr = [12, 11, 13, 5, 6]
result = insertion_sort(arr)
print(result)`,
      },
      {
        label: 'Single element',
        input: '[42]',
        expected: '[42]',
        code: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr
arr = [42]
result = insertion_sort(arr)
print(result)`,
      },
    ],
  },
  {
    id: 'selection-sort',
    name: 'Selection Sort',
    complexity: 'O(n²)',
    color: 'orange',
    cases: [
      {
        label: 'Unsorted array',
        input: '[64, 25, 12, 22, 11]',
        expected: '[11, 12, 22, 25, 64]',
        code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr
arr = [64, 25, 12, 22, 11]
result = selection_sort(arr)
print(result)`,
      },
      {
        label: 'Duplicates',
        input: '[3, 1, 4, 1, 5, 9, 2, 6]',
        expected: '[1, 1, 2, 3, 4, 5, 6, 9]',
        code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr
arr = [3, 1, 4, 1, 5, 9, 2, 6]
result = selection_sort(arr)
print(result)`,
      },
    ],
  },
  {
    id: 'linear-search',
    name: 'Linear Search',
    complexity: 'O(n)',
    color: 'teal',
    cases: [
      {
        label: 'Target found (index 2)',
        input: 'arr=[10,20,30,40,50], target=30',
        expected: '2',
        code: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1
arr = [10, 20, 30, 40, 50]
result = linear_search(arr, 30)
print(result)`,
      },
      {
        label: 'Target not found',
        input: 'arr=[10,20,30,40,50], target=99',
        expected: '-1',
        code: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1
arr = [10, 20, 30, 40, 50]
result = linear_search(arr, 99)
print(result)`,
      },
    ],
  },
];

type Status = 'idle' | 'running' | 'pass' | 'fail';

interface CaseResult {
  actual: string;
  steps: number;
  status: Status;
}

const COLOR_MAP: Record<string, string> = {
  indigo: 'border-indigo-600/40 bg-indigo-900/10',
  emerald: 'border-emerald-600/40 bg-emerald-900/10',
  amber: 'border-amber-600/40 bg-amber-900/10',
  pink: 'border-pink-600/40 bg-pink-900/10',
  cyan: 'border-cyan-600/40 bg-cyan-900/10',
  violet: 'border-violet-600/40 bg-violet-900/10',
  orange: 'border-orange-600/40 bg-orange-900/10',
  teal: 'border-teal-600/40 bg-teal-900/10',
};

const BADGE_MAP: Record<string, string> = {
  indigo: 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30',
  emerald: 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30',
  amber: 'bg-amber-600/20 text-amber-300 border border-amber-600/30',
  pink: 'bg-pink-600/20 text-pink-300 border border-pink-600/30',
  cyan: 'bg-cyan-600/20 text-cyan-300 border border-cyan-600/30',
  violet: 'bg-violet-600/20 text-violet-300 border border-violet-600/30',
  orange: 'bg-orange-600/20 text-orange-300 border border-orange-600/30',
  teal: 'bg-teal-600/20 text-teal-300 border border-teal-600/30',
};

interface TestCasesPanelProps {
  onLoadCode?: (code: string, language: string) => void;
}

export default function TestCasesPanel({ onLoadCode }: TestCasesPanelProps) {
  const [results, setResults] = useState<Record<string, CaseResult>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'bubble-sort': true,
    'binary-search': true,
    fibonacci: true,
    factorial: true,
  });

  const normalize = (s: string) => s.replace(/\s/g, '').replace(/"/g, '').replace(/'/g, '');

  const runCase = async (algoId: string, caseIdx: number, tc: TestCase) => {
    const key = `${algoId}-${caseIdx}`;
    setResults(r => ({ ...r, [key]: { actual: '', steps: 0, status: 'running' } }));
    try {
      const data = await visualizeCode(tc.code, 'python');
      const actual = (data.output[0] ?? '(no output)').trim();
      const pass = normalize(actual) === normalize(tc.expected);
      setResults(r => ({ ...r, [key]: { actual, steps: data.totalSteps, status: pass ? 'pass' : 'fail' } }));
    } catch {
      setResults(r => ({ ...r, [key]: { actual: 'Error', steps: 0, status: 'fail' } }));
    }
  };

  const runAll = async () => {
    setRunningAll(true);
    const tasks: Promise<void>[] = [];
    for (const algo of ALGORITHM_TESTS) {
      for (let idx = 0; idx < algo.cases.length; idx++) {
        tasks.push(runCase(algo.id, idx, algo.cases[idx]));
      }
    }
    await Promise.all(tasks);
    setRunningAll(false);
  };

  const totalCases = ALGORITHM_TESTS.reduce((s, a) => s + a.cases.length, 0);
  const passed = Object.values(results).filter(r => r.status === 'pass').length;
  const failed = Object.values(results).filter(r => r.status === 'fail').length;
  const ran = passed + failed;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-white font-bold text-lg">Algorithm Test Cases</h2>
            <p className="text-gray-400 text-xs">
              Correctness verification — expected vs. actual simulator output
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ran > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-4 h-4" /> {passed} passed
              </span>
              {failed > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle className="w-4 h-4" /> {failed} failed
                </span>
              )}
              <span className="text-gray-500">{ran}/{totalCases}</span>
            </div>
          )}
          <button
            onClick={runAll}
            disabled={runningAll}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {runningAll
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Running all…</>
              : <><FlaskConical className="w-4 h-4" /> Run All Tests</>}
          </button>
        </div>
      </div>

      {/* Algorithm groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ALGORITHM_TESTS.map(algo => {
          const isExpanded = expanded[algo.id] ?? false;
          const algoPassed = algo.cases.filter((_, idx) => results[`${algo.id}-${idx}`]?.status === 'pass').length;
          const algoTotal = algo.cases.length;
          const algoRan = algo.cases.filter((_, idx) => !!results[`${algo.id}-${idx}`]).length;

          return (
            <div
              key={algo.id}
              className={`rounded-xl border ${COLOR_MAP[algo.color]} overflow-hidden`}
            >
              {/* Algorithm header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(e => ({ ...e, [algo.id]: !e[algo.id] }))}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${BADGE_MAP[algo.color]}`}>
                    {algo.complexity}
                  </span>
                  <span className="text-white font-semibold text-sm">{algo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {algoRan > 0 && (
                    <span className={`text-xs font-medium ${algoPassed === algoRan ? 'text-emerald-400' : 'text-red-400'}`}>
                      {algoPassed}/{algoTotal}
                    </span>
                  )}
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Test cases */}
              {isExpanded && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  {algo.cases.map((tc, idx) => {
                    const key = `${algo.id}-${idx}`;
                    const res = results[key];
                    const status = res?.status ?? 'idle';

                    return (
                      <div key={idx} className="px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {status === 'running' && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin flex-shrink-0" />}
                              {status === 'pass' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                              {status === 'fail' && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                              {status === 'idle' && <span className="w-3.5 h-3.5 rounded-full border border-gray-600 flex-shrink-0 inline-block" />}
                              <span className="text-gray-300 text-xs font-medium">{tc.label}</span>
                            </div>
                            <div className="pl-5 space-y-1">
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                                <span className="text-gray-500">Input: <span className="text-gray-300 font-mono">{tc.input}</span></span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                                <span className="text-gray-500">Expected: <span className="text-emerald-300 font-mono">{tc.expected}</span></span>
                                {res && res.status !== 'running' && (
                                  <span className="text-gray-500">
                                    Got: <span className={`font-mono ${res.status === 'pass' ? 'text-emerald-300' : 'text-red-300'}`}>{res.actual}</span>
                                  </span>
                                )}
                                {res && res.steps > 0 && (
                                  <span className="text-gray-600 font-mono">{res.steps} steps</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => runCase(algo.id, idx, tc)}
                              disabled={status === 'running'}
                              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 px-2 py-1 rounded disabled:opacity-40 transition-colors"
                            >
                              {status === 'running' ? '…' : 'Run'}
                            </button>
                            {onLoadCode && (
                              <button
                                onClick={() => onLoadCode(tc.code, 'python')}
                                className="text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-700/40 px-2 py-1 rounded transition-colors"
                              >
                                Load
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
