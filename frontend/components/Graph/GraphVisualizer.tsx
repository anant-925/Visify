'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, RotateCcw } from 'lucide-react';

type Algorithm = 'bfs' | 'dfs' | 'dijkstra';

const INITIAL_NODES: Node[] = [
  { id: 'A', position: { x: 300, y: 50 }, data: { label: 'A' }, style: nodeStyle() },
  { id: 'B', position: { x: 150, y: 160 }, data: { label: 'B' }, style: nodeStyle() },
  { id: 'C', position: { x: 450, y: 160 }, data: { label: 'C' }, style: nodeStyle() },
  { id: 'D', position: { x: 80, y: 270 }, data: { label: 'D' }, style: nodeStyle() },
  { id: 'E', position: { x: 230, y: 270 }, data: { label: 'E' }, style: nodeStyle() },
  { id: 'F', position: { x: 380, y: 270 }, data: { label: 'F' }, style: nodeStyle() },
  { id: 'G', position: { x: 530, y: 270 }, data: { label: 'G' }, style: nodeStyle() },
];

const EDGES_DEF: Edge[] = [
  { id: 'AB', source: 'A', target: 'B', data: { weight: 4 }, label: '4', markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }, style: { stroke: '#6366f1' } },
  { id: 'AC', source: 'A', target: 'C', data: { weight: 2 }, label: '2', markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }, style: { stroke: '#6366f1' } },
  { id: 'BD', source: 'B', target: 'D', data: { weight: 5 }, label: '5', markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }, style: { stroke: '#6366f1' } },
  { id: 'BE', source: 'B', target: 'E', data: { weight: 1 }, label: '1', markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }, style: { stroke: '#6366f1' } },
  { id: 'CF', source: 'C', target: 'F', data: { weight: 3 }, label: '3', markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }, style: { stroke: '#6366f1' } },
  { id: 'CG', source: 'C', target: 'G', data: { weight: 7 }, label: '7', markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }, style: { stroke: '#6366f1' } },
  { id: 'EF', source: 'E', target: 'F', data: { weight: 2 }, label: '2', markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }, style: { stroke: '#6366f1' } },
];

function nodeStyle(color = '#1a1a3a'): React.CSSProperties {
  return {
    background: color, border: '2px solid #6366f1', color: 'white',
    borderRadius: '50%', width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: '14px'
  };
}

function buildAdjacency() {
  const adj: Record<string, Array<{ node: string; weight: number }>> = {};
  for (const n of INITIAL_NODES) adj[n.id] = [];
  for (const e of EDGES_DEF) {
    adj[e.source].push({ node: e.target, weight: (e.data as { weight: number }).weight });
    adj[e.target].push({ node: e.source, weight: (e.data as { weight: number }).weight });
  }
  return adj;
}

function bfsOrder(start: string) {
  const adj = buildAdjacency();
  const visited = new Set<string>();
  const queue = [start];
  const order: string[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node); order.push(node);
    for (const { node: nb } of adj[node]) { if (!visited.has(nb)) queue.push(nb); }
  }
  return order;
}

function dfsOrder(start: string) {
  const adj = buildAdjacency();
  const visited = new Set<string>();
  const order: string[] = [];
  function dfs(n: string) {
    if (visited.has(n)) return;
    visited.add(n); order.push(n);
    for (const { node: nb } of adj[n]) dfs(nb);
  }
  dfs(start);
  return order;
}

function dijkstraOrder(start: string) {
  const adj = buildAdjacency();
  const dist: Record<string, number> = {};
  for (const n of INITIAL_NODES) dist[n.id] = Infinity;
  dist[start] = 0;
  const visited = new Set<string>();
  const order: string[] = [];
  while (order.length < INITIAL_NODES.length) {
    let u = '';
    let minDist = Infinity;
    for (const n of INITIAL_NODES) {
      if (!visited.has(n.id) && dist[n.id] < minDist) { minDist = dist[n.id]; u = n.id; }
    }
    if (!u) break;
    visited.add(u); order.push(u);
    for (const { node: v, weight } of adj[u]) {
      if (dist[u] + weight < dist[v]) dist[v] = dist[u] + weight;
    }
  }
  return order;
}

export default function GraphVisualizer() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(EDGES_DEF);
  const [algorithm, setAlgorithm] = useState<Algorithm>('bfs');
  const [startNode, setStartNode] = useState('A');
  const [running, setRunning] = useState(false);
  const [visitOrder, setVisitOrder] = useState<string[]>([]);
  const [stepIdx, setStepIdx] = useState(-1);

  const reset = useCallback(() => {
    setNodes(INITIAL_NODES);
    setEdges(EDGES_DEF);
    setVisitOrder([]); setStepIdx(-1); setRunning(false);
  }, [setNodes, setEdges]);

  const run = useCallback(() => {
    reset();
    let order: string[];
    if (algorithm === 'bfs') order = bfsOrder(startNode);
    else if (algorithm === 'dfs') order = dfsOrder(startNode);
    else order = dijkstraOrder(startNode);
    setVisitOrder(order);
    setStepIdx(0);
    setRunning(true);
  }, [algorithm, startNode, reset]);

  useEffect(() => {
    if (!running || stepIdx < 0 || stepIdx >= visitOrder.length) {
      if (stepIdx >= visitOrder.length) setRunning(false);
      return;
    }
    const timer = setTimeout(() => {
      const nodeId = visitOrder[stepIdx];
      setNodes(ns => ns.map(n => ({
        ...n,
        style: n.id === nodeId
          ? nodeStyle('#1e3a1e')
          : visitOrder.slice(0, stepIdx).includes(n.id)
          ? { ...nodeStyle('#1e2a1a'), borderColor: '#22c55e' }
          : nodeStyle()
      })));
      setStepIdx(i => i + 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [running, stepIdx, visitOrder, setNodes]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex flex-wrap items-center gap-3">
        <select
          value={algorithm}
          onChange={e => setAlgorithm(e.target.value as Algorithm)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
        >
          <option value="bfs">BFS - Breadth First Search</option>
          <option value="dfs">DFS - Depth First Search</option>
          <option value="dijkstra">Dijkstra&apos;s Shortest Path</option>
        </select>
        <select
          value={startNode}
          onChange={e => setStartNode(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
        >
          {INITIAL_NODES.map(n => <option key={n.id}>{n.id}</option>)}
        </select>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5" />
          Run
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded text-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        {visitOrder.length > 0 && (
          <span className="text-gray-400 text-sm">
            Visit order: <span className="text-indigo-300 font-mono">{visitOrder.slice(0, stepIdx).join(' → ')}</span>
          </span>
        )}
      </div>
      <div style={{ height: 420 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls />
          <Background color="#374151" gap={20} />
        </ReactFlow>
      </div>
    </div>
  );
}
