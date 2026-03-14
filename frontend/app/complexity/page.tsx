'use client';

import { useState } from 'react';
import CodeEditor from '@/components/Editor/CodeEditor';
import ComplexityDisplay from '@/components/Complexity/ComplexityDisplay';
import ComplexityChart from '@/components/Complexity/ComplexityChart';
import { analyzeComplexity, type ComplexityResponse } from '@/lib/api';
import { BarChart2, Loader2, Play } from 'lucide-react';

const EXAMPLES = [
  { label: 'O(n) – Linear', language: 'python', code: `def sum_array(arr):\n    total = 0\n    for i in range(len(arr)):\n        total += arr[i]\n    return total` },
  { label: 'O(n²) – Quadratic', language: 'python', code: `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr` },
  { label: 'O(log n) – Binary Search', language: 'python', code: `def binary_search(arr, target):\n    low = 0\n    high = len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1` },
  { label: 'O(2^n) – Fibonacci', language: 'python', code: `def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)` },
];

export default function ComplexityPage() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplexityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true); setError(null);
    try {
      const data = await analyzeComplexity(code, language);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-400" />
            Complexity Analyzer
          </h1>
          <p className="text-gray-400 text-sm">Automatically detect Big-O time and space complexity</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="python">Python</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
          </select>
          <button
            onClick={analyze}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Examples */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => { setCode(ex.code); setLanguage(ex.language); setResult(null); }}
            className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-1.5 rounded"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-4">
          <CodeEditor value={code} onChange={setCode} language={language} height="360px" />
          <ComplexityChart highlighted={result?.bigO} />
        </div>
        <ComplexityDisplay result={result} loading={loading} />
      </div>
    </div>
  );
}
