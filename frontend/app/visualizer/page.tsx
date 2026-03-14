'use client';

import { useState, useCallback } from 'react';
import CodeEditor from '@/components/Editor/CodeEditor';
import ExecutionVisualizer from '@/components/Visualizer/ExecutionVisualizer';
import VariablePanel from '@/components/Visualizer/VariablePanel';
import StackVisualizer from '@/components/Visualizer/StackVisualizer';
import MemoryVisualizer from '@/components/Visualizer/MemoryVisualizer';
import DataStructureVisualizer from '@/components/Visualizer/DataStructureVisualizer';
import RecursionTree from '@/components/Visualizer/RecursionTree';
import { visualizeCode, getAlgorithmLibrary, type VisualizeResponse, type Snapshot, type Algorithm } from '@/lib/api';
import { Play, Loader2, BookOpen, ChevronDown } from 'lucide-react';
import { useEffect } from 'react';

const DEFAULT_CODE = `# Bubble Sort Example
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
    return arr

arr = [64, 34, 25, 12, 22]
result = bubble_sort(arr)
print(result)`;

export default function VisualizerPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisualizeResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState<'variables' | 'stack' | 'memory' | 'structures'>('variables');

  useEffect(() => {
    getAlgorithmLibrary().then(r => setAlgorithms(r.algorithms)).catch(() => {});
  }, []);

  const snapshot: Snapshot | null = result?.snapshots[currentStep] || null;

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(0);
    try {
      const data = await visualizeCode(code, language);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to visualize code');
    } finally {
      setLoading(false);
    }
  };

  const setStep = useCallback((step: number | ((prev: number) => number)) => {
    setCurrentStep(step);
  }, []);

  const isRecursive = /def\s+\w+/.test(code) && (code.includes('fib') || code.includes('factorial') || code.includes('fact'));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Code Visualizer</h1>
          <p className="text-gray-400 text-sm">Step through code execution line by line</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLibrary(s => !s)}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-2 rounded-lg text-sm"
          >
            <BookOpen className="w-4 h-4" />
            Library
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLibrary ? 'rotate-180' : ''}`} />
          </button>
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
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Running...' : 'Run & Visualize'}
          </button>
        </div>
      </div>

      {/* Algorithm Library */}
      {showLibrary && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <h3 className="text-gray-300 font-semibold mb-3 text-sm uppercase tracking-wider">Algorithm Library</h3>
          <div className="flex flex-wrap gap-2">
            {algorithms.map(algo => (
              <button
                key={algo.id}
                onClick={() => { setCode(algo.code); setLanguage(algo.language); setShowLibrary(false); }}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-1.5 rounded text-sm flex items-center gap-2"
              >
                <span className="font-semibold text-indigo-300">{algo.name}</span>
                <span className="text-gray-500 text-xs font-mono">{algo.timeComplexity}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Code Editor */}
        <div className="space-y-3">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            height="420px"
            highlightLine={snapshot?.line}
          />
          {result && (
            <ExecutionVisualizer
              snapshots={result.snapshots}
              currentStep={currentStep}
              onStepChange={setStep}
            />
          )}
        </div>

        {/* Panels */}
        <div className="space-y-3">
          {/* Tab selector */}
          <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
            {(['variables', 'stack', 'memory', 'structures'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'variables' && <VariablePanel snapshot={snapshot} />}
          {activeTab === 'stack' && <StackVisualizer snapshot={snapshot} />}
          {activeTab === 'memory' && <MemoryVisualizer snapshot={snapshot} />}
          {activeTab === 'structures' && <DataStructureVisualizer snapshot={snapshot} />}

          {/* Output */}
          {result?.output && result.output.length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-2">Output</h3>
              <div className="bg-black/60 rounded p-3 font-mono text-sm text-green-400 max-h-40 overflow-y-auto">
                {result.output.map((line, i) => <div key={i}>{line || '\u00A0'}</div>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recursion tree */}
      {isRecursive && result && (
        <RecursionTree code={code} language={language} />
      )}
    </div>
  );
}
