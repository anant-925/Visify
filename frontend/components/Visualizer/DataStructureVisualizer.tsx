'use client';

import type { Snapshot } from '@/lib/api';

interface DataStructureVisualizerProps {
  snapshot: Snapshot | null;
}

function ArrayViz({ name, values }: { name: string; values: unknown[] }) {
  return (
    <div className="mb-4">
      <h4 className="text-indigo-300 text-sm font-semibold mb-2 font-mono">{name}</h4>
      <div className="flex flex-wrap gap-1">
        {values.map((val, i) => (
          <div key={i} className="relative">
            <div className="border border-indigo-600 bg-indigo-900/20 rounded min-w-[44px] h-10 flex items-center justify-center font-mono text-sm text-white">
              {val === null ? 'null' : String(val)}
            </div>
            <div className="text-center text-gray-500 text-xs mt-0.5">{i}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TreeNode({ val, left, right }: { val: unknown; left?: unknown; right?: unknown }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-900/30 flex items-center justify-center font-mono text-sm text-white">
        {String(val)}
      </div>
      {(left !== undefined || right !== undefined) && (
        <div className="flex gap-8 mt-2">
          {left !== undefined ? <TreeNode val={left} /> : <div className="w-10" />}
          {right !== undefined ? <TreeNode val={right} /> : <div className="w-10" />}
        </div>
      )}
    </div>
  );
}

export default function DataStructureVisualizer({ snapshot }: DataStructureVisualizerProps) {
  const vars = snapshot?.variables || {};
  const arrays = Object.entries(vars).filter(([k, v]) => !k.startsWith('__') && Array.isArray(v)) as [string, unknown[]][];

  if (!snapshot || arrays.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-3">Data Structures</h3>
        <p className="text-gray-500 text-sm">Arrays and lists will appear here during execution</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-4">Data Structures</h3>
      {arrays.map(([name, values]) => (
        <ArrayViz key={name} name={name} values={values} />
      ))}
    </div>
  );
}
