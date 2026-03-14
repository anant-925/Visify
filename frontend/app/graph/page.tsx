import GraphVisualizer from '@/components/Graph/GraphVisualizer';
import { Share2 } from 'lucide-react';

export default function GraphPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Share2 className="w-6 h-6 text-rose-400" />
          Graph Algorithm Visualizer
        </h1>
        <p className="text-gray-400 text-sm">Visualize BFS, DFS, and Dijkstra&apos;s algorithm on interactive graphs</p>
      </div>
      <GraphVisualizer />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'BFS', full: 'Breadth First Search', complexity: 'O(V + E)', desc: 'Explores all neighbors before going deeper. Uses a queue. Finds shortest path in unweighted graphs.' },
          { name: 'DFS', full: 'Depth First Search', complexity: 'O(V + E)', desc: 'Explores as far as possible before backtracking. Uses a stack (or recursion). Good for connectivity.' },
          { name: "Dijkstra's", full: "Dijkstra's Shortest Path", complexity: 'O((V + E) log V)', desc: 'Finds shortest path in weighted graphs. Uses a priority queue. Requires non-negative edge weights.' },
        ].map(algo => (
          <div key={algo.name} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">{algo.full}</h3>
              <span className="font-mono text-xs text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded">{algo.complexity}</span>
            </div>
            <p className="text-gray-400 text-sm">{algo.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
