'use client';

import type { Snapshot } from '@/lib/api';

interface StackVisualizerProps {
  snapshot: Snapshot | null;
}

export default function StackVisualizer({ snapshot }: StackVisualizerProps) {
  const frames = snapshot?.stackFrames || [];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-3">
        Call Stack
        <span className="ml-2 text-gray-600 normal-case font-normal text-xs">
          ({frames.length} frame{frames.length !== 1 ? 's' : ''})
        </span>
      </h3>
      {frames.length === 0 ? (
        <p className="text-gray-500 text-sm">No active frames</p>
      ) : (
        <div className="space-y-2">
          {[...frames].reverse().map((frame, i) => (
            <div
              key={i}
              className={`border rounded-lg px-3 py-2.5 ${
                i === 0
                  ? 'border-indigo-500 bg-indigo-900/20'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-semibold text-sm text-white">
                  {frame.name}
                </span>
                {i === 0 && (
                  <span className="text-xs bg-indigo-600 text-white rounded px-1.5 py-0.5">
                    active
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">line {frame.line}</div>
              {Object.keys(frame.variables || {}).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(frame.variables)
                    .filter(([k]) => !k.startsWith('__'))
                    .map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs font-mono">
                        <span className="text-indigo-300">{k}:</span>
                        <span className="text-gray-300">{JSON.stringify(v)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
