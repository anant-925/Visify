'use client';

import type { Snapshot } from '@/lib/api';

interface MemoryVisualizerProps {
  snapshot: Snapshot | null;
}

function renderMemoryCell(val: unknown, index?: number) {
  const display = val === null ? 'null' : val === undefined ? '—' : String(val);
  const isNum = typeof val === 'number';
  const isStr = typeof val === 'string';

  return (
    <div
      key={index}
      className={`border rounded flex flex-col items-center justify-center min-w-[48px] h-12 px-1 text-xs font-mono ${
        isNum
          ? 'border-blue-600 bg-blue-900/20 text-blue-300'
          : isStr
          ? 'border-green-600 bg-green-900/20 text-green-300'
          : 'border-gray-600 bg-gray-800 text-gray-400'
      }`}
    >
      {index !== undefined && (
        <span className="text-gray-600 text-[10px]">[{index}]</span>
      )}
      <span>{display}</span>
    </div>
  );
}

export default function MemoryVisualizer({ snapshot }: MemoryVisualizerProps) {
  const vars = snapshot?.variables || {};
  const arrays = Object.entries(vars).filter(([k, v]) => !k.startsWith('__') && Array.isArray(v));
  const scalars = Object.entries(vars).filter(([k, v]) => !k.startsWith('__') && !Array.isArray(v) && typeof v !== 'object');

  if (!snapshot) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-3">Memory</h3>
        <p className="text-gray-500 text-sm">Run code to see memory layout</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-4">Memory Layout</h3>

      {scalars.length > 0 && (
        <div className="mb-4">
          <h4 className="text-gray-500 text-xs uppercase mb-2">Scalars</h4>
          <div className="flex flex-wrap gap-2">
            {scalars.map(([name, val]) => (
              <div key={name} className="flex flex-col items-center">
                <span className="text-indigo-400 text-xs mb-1">{name}</span>
                {renderMemoryCell(val)}
              </div>
            ))}
          </div>
        </div>
      )}

      {arrays.length > 0 && (
        <div>
          <h4 className="text-gray-500 text-xs uppercase mb-2">Arrays / Lists</h4>
          <div className="space-y-3">
            {arrays.map(([name, val]) => {
              const arr = val as unknown[];
              return (
                <div key={name}>
                  <span className="text-indigo-400 text-xs mb-1 block">{name}[{arr.length}]</span>
                  <div className="flex flex-wrap gap-1">
                    {arr.map((item, i) => renderMemoryCell(item, i))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scalars.length === 0 && arrays.length === 0 && (
        <p className="text-gray-500 text-sm">No data to display</p>
      )}
    </div>
  );
}
