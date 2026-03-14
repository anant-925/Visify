'use client';

import { useState, useEffect } from 'react';
import { getResources, type Resource } from '@/lib/api';
import { BookOpen, ExternalLink, Layers } from 'lucide-react';

const TAGS = ['All', 'complexity', 'sorting', 'searching', 'recursion', 'graph', 'dynamic-programming', 'data-structures'];

const TYPE_COLORS: Record<string, string> = {
  article: 'bg-blue-900/40 text-blue-300 border border-blue-700',
  interactive: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700',
  video: 'bg-purple-900/40 text-purple-300 border border-purple-700'
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('All');

  useEffect(() => {
    const params = activeTag !== 'All' ? { tag: activeTag } : {};
    setLoading(true);
    getResources(params)
      .then(r => setResources(r.resources))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [activeTag]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-400" />
          Learning Resources
        </h1>
        <p className="text-gray-400 text-sm">Curated articles and tools for mastering algorithms</p>
      </div>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTag === tag
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-indigo-600 transition-all duration-200 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-white font-semibold group-hover:text-indigo-300 transition-colors">
                  {resource.title}
                </h3>
                <ExternalLink className="w-4 h-4 text-gray-500 shrink-0 group-hover:text-indigo-400" />
              </div>
              <p className="text-gray-400 text-sm flex-1 mb-3">{resource.description}</p>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[resource.type] || 'bg-gray-800 text-gray-400'}`}>
                  {resource.type}
                </span>
                {resource.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      )}

      {!loading && resources.length === 0 && (
        <div className="text-center py-12">
          <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No resources found for this tag</p>
        </div>
      )}
    </div>
  );
}
