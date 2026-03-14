'use client';

import { useState } from 'react';
import CodeEditor from '@/components/Editor/CodeEditor';
import { analyzeComplexity, visualizeCode, type ComplexityResponse, type VisualizeResponse } from '@/lib/api';
import { GitCompare, Play } from 'lucide-react';

const COMPARE_EXAMPLES = [
  {
    label: 'Bubble vs Binary Search',
    left: { code: `def linear_search(arr, target):\n    for i in range(len(arr)):\n        if arr[i] == target:\n            return i\n    return -1\n\narr = [1,2,3,4,5,6,7,8,9,10]\nresult = linear_search(arr, 7)`, name: 'Linear Search' },
    right: { code: `def binary_search(arr, target):\n    low = 0\n    high = len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\narr = [1,2,3,4,5,6,7,8,9,10]\nresult = binary_search(arr, 7)`, name: 'Binary Search' }
  },
  {
    label: 'Bubble vs Selection Sort',
    left: { code: `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n\narr = [64, 34, 25, 12, 22]`, name: 'Bubble Sort' },
    right: { code: `def selection_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        min_idx = i\n        for j in range(i + 1, n):\n            if arr[j] < arr[min_idx]:\n                min_idx = j\n        arr[i], arr[min_idx] = arr[min_idx], arr[i]\n    return arr\n\narr = [64, 34, 25, 12, 22]`, name: 'Selection Sort' }
  }
];

interface Side {
  code: string;
  language: string;
  complexity: ComplexityResponse | null;
  trace: VisualizeResponse | null;
  loading: boolean;
  name: string;
}

const defaultSide = (name: string, code = ''): Side => ({
  code, language: 'python', complexity: null, trace: null, loading: false, name
});

export default function AlgorithmCompare() {
  const [left, setLeft] = useState<Side>(defaultSide('Algorithm A', COMPARE_EXAMPLES[0].left.code));
  const [right, setRight] = useState<Side>(defaultSide('Algorithm B', COMPARE_EXAMPLES[0].right.code));

  async function analyze(side: Side, setSide: (s: Side) => void) {
    setSide({ ...side, loading: true });
    try {
      const [complexity, trace] = await Promise.all([
        analyzeComplexity(side.code, side.language),
        visualizeCode(side.code, side.language)
      ]);
      setSide({ ...side, loading: false, complexity, trace });
    } catch {
      setSide({ ...side, loading: false });
    }
  }

  function loadExample(idx: number) {
    const ex = COMPARE_EXAMPLES[idx];
    setLeft(defaultSide(ex.left.name, ex.left.code));
    setRight(defaultSide(ex.right.name, ex.right.code));
  }

  const runBoth = async () => {
    await Promise.all([
      analyze({ ...left }, setLeft),
      analyze({ ...right }, setRight)
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Example picker */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-gray-400 text-sm">Examples:</span>
        {COMPARE_EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => loadExample(i)}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded border border-gray-600"
          >
            {ex.label}
          </button>
        ))}
        <button
          onClick={runBoth}
          className="ml-auto flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-sm"
        >
          <Play className="w-3.5 h-3.5" />
          Compare Both
        </button>
      </div>

      {/* Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {([{ side: left, setSide: setLeft }, { side: right, setSide: setRight }] as const).map(
          ({ side, setSide }, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                <input
                  value={side.name}
                  onChange={e => setSide({ ...side, name: e.target.value })}
                  className="bg-transparent text-white font-semibold text-sm outline-none border-b border-gray-700 focus:border-indigo-500 pb-0.5"
                />
              </div>
              <CodeEditor
                value={side.code}
                onChange={code => setSide({ ...side, code })}
                language={side.language}
                height="280px"
              />
              <div className="flex gap-2">
                <select
                  value={side.language}
                  onChange={e => setSide({ ...side, language: e.target.value })}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                >
                  <option value="python">Python</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                </select>
                <button
                  onClick={() => analyze(side, setSide)}
                  disabled={side.loading}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  Analyze
                </button>
              </div>
              {side.complexity && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Time</span>
                    <span className="font-mono font-bold text-yellow-400 text-lg">{side.complexity.bigO}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Space</span>
                    <span className="font-mono font-bold text-blue-400">{side.complexity.spaceComplexity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Steps</span>
                    <span className="text-white text-sm">{side.trace?.totalSteps ?? '—'}</span>
                  </div>
                  <p className="text-gray-400 text-xs pt-1">{side.complexity.explanation}</p>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Verdict */}
      {left.complexity && right.complexity && (
        <div className="bg-gray-900 border border-indigo-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-semibold">Comparison Verdict</h3>
          </div>
          <p className="text-gray-300 text-sm">
            <span className="text-indigo-300 font-semibold">{left.name}</span> has complexity{' '}
            <span className="font-mono text-yellow-300">{left.complexity.bigO}</span> and{' '}
            <span className="text-emerald-300 font-semibold">{right.name}</span> has{' '}
            <span className="font-mono text-yellow-300">{right.complexity.bigO}</span>.{' '}
            {left.complexity.bigO === right.complexity.bigO
              ? 'Both algorithms have the same asymptotic complexity.'
              : 'These algorithms differ in their growth rates — choose based on your input size and constraints.'}
          </p>
        </div>
      )}
    </div>
  );
}
