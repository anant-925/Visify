'use client';

import type { Snapshot } from '@/lib/api';

interface VariablePanelProps {
  snapshot: Snapshot | null;
}

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (Array.isArray(val)) return `[${val.map(renderValue).join(', ')}]`;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function getTypeColor(val: unknown): string {
  if (val === null || val === undefined) return 'text-gray-400';
  if (typeof val === 'boolean') return 'text-purple-400';
  if (typeof val === 'number') return 'text-blue-400';
  if (typeof val === 'string') return 'text-green-400';
  if (Array.isArray(val)) return 'text-orange-400';
  return 'text-gray-200';
}

function getTypeBadge(val: unknown): string {
  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return 'bool';
  if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
  if (typeof val === 'string') return 'str';
  if (Array.isArray(val)) return `list[${val.length}]`;
  if (typeof val === 'object') return 'dict';
  return 'unknown';
}

export default function VariablePanel({ snapshot }: VariablePanelProps) {
  if (!snapshot) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-3">Variables</h3>
        <p className="text-gray-500 text-sm">Run code to see variables</p>
      </div>
    );
  }

  const vars = snapshot.variables || {};
  const entries = Object.entries(vars).filter(([k]) => !k.startsWith('__'));

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-3">
        Variables <span className="text-gray-600 normal-case font-normal">(step {snapshot.step})</span>
      </h3>
      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">No variables yet</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([name, val]) => (
            <div key={name} className="flex items-start justify-between gap-2 bg-gray-800 rounded px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-indigo-300 font-mono text-sm font-semibold shrink-0">{name}</span>
                <span className="text-gray-500 text-xs bg-gray-700 rounded px-1.5 py-0.5 shrink-0">
                  {getTypeBadge(val)}
                </span>
              </div>
              <span className={`font-mono text-sm text-right break-all ${getTypeColor(val)}`}>
                {renderValue(val)}
              </span>
            </div>
          ))}
        </div>
      )}
      {snapshot.output && snapshot.output.length > 0 && (
        <div className="mt-4">
          <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Output</h4>
          <div className="bg-black/50 rounded px-3 py-2 font-mono text-sm text-green-400 max-h-32 overflow-y-auto">
            {snapshot.output.map((line, i) => (
              <div key={i}>{line || '\u00A0'}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
