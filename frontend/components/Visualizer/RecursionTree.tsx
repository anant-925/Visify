'use client';

import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

interface RecursionTreeProps {
  code: string;
  language: string;
}

interface CallNode {
  id: string;
  label: string;
  parentId: string | null;
  depth: number;
  index: number;
  result?: string;
}

function buildFibTree(n: number, parentId: string | null, depth: number, counter: { v: number }): CallNode[] {
  if (depth > 4 || n < 0) return [];
  const id = `node-${counter.v++}`;
  const node: CallNode = { id, label: `fib(${n})`, parentId, depth, index: counter.v };
  if (n <= 1) {
    node.result = String(n);
    return [node];
  }
  const left = buildFibTree(n - 1, id, depth + 1, counter);
  const right = buildFibTree(n - 2, id, depth + 1, counter);
  return [node, ...left, ...right];
}

function buildFactTree(n: number, parentId: string | null, depth: number, counter: { v: number }): CallNode[] {
  if (depth > 6 || n < 0) return [];
  const id = `node-${counter.v++}`;
  const node: CallNode = { id, label: `fact(${n})`, parentId, depth, index: counter.v };
  if (n <= 1) { node.result = '1'; return [node]; }
  const child = buildFactTree(n - 1, id, depth + 1, counter);
  return [node, ...child];
}

function treeToBFS(nodes: CallNode[]) {
  const byDepth: Record<number, CallNode[]> = {};
  for (const n of nodes) {
    if (!byDepth[n.depth]) byDepth[n.depth] = [];
    byDepth[n.depth].push(n);
  }
  return byDepth;
}

export default function RecursionTree({ code }: RecursionTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const buildTree = useCallback(() => {
    let callNodes: CallNode[] = [];
    const counter = { v: 0 };

    const fibMatch = code.match(/fib\s*\((\d+)\)/);
    const factMatch = code.match(/factorial\s*\((\d+)\)|fact\s*\((\d+)\)/);

    if (fibMatch) {
      callNodes = buildFibTree(parseInt(fibMatch[1]), null, 0, counter);
    } else if (factMatch) {
      const n = parseInt(factMatch[1] || factMatch[2]);
      callNodes = buildFactTree(n, null, 0, counter);
    } else {
      return;
    }

    const byDepth = treeToBFS(callNodes);
    const rfNodes = callNodes.map((cn) => {
      const siblings = byDepth[cn.depth] || [];
      const sibIdx = siblings.findIndex(s => s.id === cn.id);
      const totalWidth = siblings.length * 120;
      const x = sibIdx * 120 - totalWidth / 2 + 60;
      const y = cn.depth * 90;

      return {
        id: cn.id,
        position: { x, y },
        data: { label: cn.label + (cn.result !== undefined ? ` → ${cn.result}` : '') },
        style: {
          background: cn.result !== undefined ? '#1a3a1a' : '#1a1a3a',
          border: `1px solid ${cn.result !== undefined ? '#22c55e' : '#6366f1'}`,
          color: 'white',
          borderRadius: '8px',
          fontSize: '12px',
          padding: '6px 10px'
        }
      };
    });

    const rfEdges = callNodes
      .filter(cn => cn.parentId)
      .map((cn, i) => ({
        id: `edge-${i}`,
        source: cn.parentId!,
        target: cn.id,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: { stroke: '#6366f1', strokeWidth: 1.5 }
      }));

    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [code, setNodes, setEdges]);

  useEffect(() => { buildTree(); }, [buildTree]);

  if (nodes.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-700">
        <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Recursion Tree</h3>
      </div>
      <div style={{ height: 350 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls />
          <Background color="#374151" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
