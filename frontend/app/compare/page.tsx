import AlgorithmCompare from '@/components/Compare/AlgorithmCompare';
import { GitCompare } from 'lucide-react';

export default function ComparePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-amber-400" />
          Algorithm Comparison
        </h1>
        <p className="text-gray-400 text-sm">Compare algorithms side-by-side to understand trade-offs</p>
      </div>
      <AlgorithmCompare />
    </div>
  );
}
