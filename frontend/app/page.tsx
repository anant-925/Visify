import Link from 'next/link';
import { Code2, BarChart2, GitCompare, Share2, BookOpen, Zap, Eye, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Step-by-Step Execution',
    description: 'Watch your code execute line-by-line with real-time variable tracking and call stack visualization.',
    href: '/visualizer',
    color: 'bg-indigo-500'
  },
  {
    icon: BarChart2,
    title: 'Complexity Analysis',
    description: 'Automatically detect time and space complexity with Big-O notation and detailed explanations.',
    href: '/complexity',
    color: 'bg-emerald-500'
  },
  {
    icon: GitCompare,
    title: 'Algorithm Comparison',
    description: 'Compare multiple algorithms side-by-side to understand their performance trade-offs.',
    href: '/compare',
    color: 'bg-amber-500'
  },
  {
    icon: Share2,
    title: 'Graph Visualizer',
    description: 'Visualize BFS, DFS, and shortest path algorithms on interactive graphs.',
    href: '/graph',
    color: 'bg-rose-500'
  },
  {
    icon: BookOpen,
    title: 'Learning Resources',
    description: 'Curated articles and interactive tools to deepen your algorithms knowledge.',
    href: '/resources',
    color: 'bg-purple-500'
  },
  {
    icon: Zap,
    title: 'Algorithm Library',
    description: 'Pre-built examples of common algorithms ready to visualize instantly.',
    href: '/visualizer',
    color: 'bg-cyan-500'
  }
];

const complexities = [
  { notation: 'O(1)', name: 'Constant', color: 'text-emerald-400', width: 'w-4' },
  { notation: 'O(log n)', name: 'Logarithmic', color: 'text-green-400', width: 'w-12' },
  { notation: 'O(n)', name: 'Linear', color: 'text-yellow-400', width: 'w-24' },
  { notation: 'O(n log n)', name: 'Linearithmic', color: 'text-orange-400', width: 'w-36' },
  { notation: 'O(n²)', name: 'Quadratic', color: 'text-red-400', width: 'w-48' },
  { notation: 'O(2^n)', name: 'Exponential', color: 'text-rose-500', width: 'w-64' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 py-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-700/50 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-6">
            <Zap className="w-4 h-4" />
            Interactive Algorithm Learning Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 mb-6">
            Visify
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            See your code think. Understand algorithms deeply.
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-lg">
            Step through code execution, visualize data structures, analyze time complexity,
            and compare algorithms — all in one interactive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/visualizer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
            >
              <Code2 className="w-5 h-5" />
              Start Visualizing
            </Link>
            <Link
              href="/complexity"
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold px-8 py-3 rounded-lg transition-colors text-lg border border-gray-600"
            >
              <TrendingUp className="w-5 h-5" />
              Analyze Complexity
            </Link>
          </div>
        </div>
      </section>

      {/* Complexity Reference */}
      <section className="bg-gray-900/50 border-y border-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-gray-400 text-sm uppercase tracking-widest mb-8">
            Complexity Quick Reference
          </h2>
          <div className="space-y-3">
            {complexities.map(({ notation, name, color, width }) => (
              <div key={notation} className="flex items-center gap-4">
                <span className={`font-mono font-bold w-28 text-right ${color}`}>{notation}</span>
                <div className={`h-3 ${width} bg-current rounded-full opacity-60 ${color}`} />
                <span className="text-gray-400 text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Everything You Need</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            A complete toolkit for learning and mastering data structures and algorithms.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, href, color }) => (
              <Link
                key={href + title}
                href={href}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-700 hover:bg-gray-800/80 transition-all duration-200"
              >
                <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-indigo-300 transition-colors">
                  {title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-950 to-purple-950 border-t border-indigo-900/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Learn?</h2>
          <p className="text-indigo-300 mb-8">
            Paste any Python or C code and watch it come to life.
          </p>
          <Link
            href="/visualizer"
            className="inline-flex items-center gap-2 bg-white text-indigo-900 font-bold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors text-lg"
          >
            <Code2 className="w-5 h-5" />
            Open Visualizer
          </Link>
        </div>
      </section>
    </div>
  );
}
