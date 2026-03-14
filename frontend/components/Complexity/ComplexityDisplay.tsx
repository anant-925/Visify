'use client';

import type { ComplexityResponse } from '@/lib/api';
import { TrendingUp, Clock, Database, BookOpen } from 'lucide-react';

interface ComplexityDisplayProps {
  result: ComplexityResponse | null;
  loading?: boolean;
}

const BIG_O_COLORS: Record<string, string> = {
  'O(1)': 'text-emerald-400 border-emerald-500 bg-emerald-900/20',
  'O(log n)': 'text-green-400 border-green-500 bg-green-900/20',
  'O(n)': 'text-yellow-400 border-yellow-500 bg-yellow-900/20',
  'O(n log n)': 'text-orange-400 border-orange-500 bg-orange-900/20',
  'O(n²)': 'text-red-400 border-red-500 bg-red-900/20',
  'O(n³)': 'text-rose-400 border-rose-500 bg-rose-900/20',
  'O(2^n)': 'text-purple-400 border-purple-500 bg-purple-900/20',
};

function getColors(bigO: string) {
  return BIG_O_COLORS[bigO] || 'text-gray-400 border-gray-500 bg-gray-800';
}

export default function ComplexityDisplay({ result, loading }: ComplexityDisplayProps) {
  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-700 rounded w-1/2" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center">
        <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Analyze your code to see complexity results</p>
      </div>
    );
  }

  const timeColors = getColors(result.bigO);
  const spaceColors = getColors(result.spaceComplexity);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700">
        <h3 className="text-white font-bold text-lg">{result.name}</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Big-O badges */}
        <div className="flex flex-wrap gap-4">
          <div className={`border rounded-xl px-4 py-3 ${timeColors}`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider opacity-70">Time</span>
            </div>
            <div className="text-3xl font-bold font-mono">{result.bigO}</div>
          </div>
          <div className={`border rounded-xl px-4 py-3 ${spaceColors}`}>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider opacity-70">Space</span>
            </div>
            <div className="text-3xl font-bold font-mono">{result.spaceComplexity}</div>
          </div>
        </div>

        {/* Recurrence */}
        {result.recurrenceRelation && (
          <div className="bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400 text-xs uppercase tracking-wider">Recurrence</span>
            <div className="font-mono text-indigo-300 mt-1">{result.recurrenceRelation}</div>
          </div>
        )}

        {/* Explanation */}
        <div>
          <h4 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            Explanation
          </h4>
          <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
        </div>

        {/* Steps */}
        {result.steps?.length > 0 && (
          <div>
            <h4 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Analysis Steps</h4>
            <ol className="space-y-2">
              {result.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-900 border border-indigo-600 flex items-center justify-center text-indigo-300 text-xs">
                    {i + 1}
                  </span>
                  <span className="text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
