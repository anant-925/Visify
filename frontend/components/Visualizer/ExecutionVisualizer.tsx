'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Snapshot } from '@/lib/api';

interface ExecutionVisualizerProps {
  snapshots: Snapshot[];
  currentStep: number;
  onStepChange: (step: number | ((prev: number) => number)) => void;
}

export default function ExecutionVisualizer({
  snapshots,
  currentStep,
  onStepChange
}: ExecutionVisualizerProps) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = snapshots.length;
  const snapshot = snapshots[currentStep] || null;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        onStepChange(prev => {
          if (prev >= total - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, total, onStepChange]);

  if (total === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400">Run your code to start the visualization</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Current step info */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Step <span className="text-white font-semibold">{currentStep + 1}</span>
          <span className="text-gray-600"> / {total}</span>
        </span>
        <span className="text-xs text-indigo-300 bg-indigo-900/40 px-2 py-1 rounded font-mono">
          Line {snapshot?.line}
        </span>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b border-gray-700">
        <p className="text-gray-300 text-sm">{snapshot?.description || 'No description'}</p>
        {snapshot?.lineExecuting && (
          <code className="mt-1 block text-indigo-300 text-xs font-mono bg-gray-800 px-2 py-1 rounded">
            {snapshot.lineExecuting.trim()}
          </code>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3">
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full transition-all duration-200"
            style={{ width: `${((currentStep + 1) / total) * 100}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={total - 1}
          value={currentStep}
          onChange={e => onStepChange(Number(e.target.value))}
          className="w-full mt-2 accent-indigo-500"
        />
      </div>

      {/* Controls */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStepChange(0)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40"
            disabled={currentStep === 0}
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40"
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onStepChange(Math.min(total - 1, currentStep + 1))}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40"
            disabled={currentStep >= total - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStepChange(total - 1)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40"
            disabled={currentStep >= total - 1}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Speed</span>
          <select
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-300"
          >
            <option value={1500}>0.5×</option>
            <option value={800}>1×</option>
            <option value={400}>2×</option>
            <option value={200}>4×</option>
          </select>
        </div>
      </div>
    </div>
  );
}
