'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, BarChart2, GitCompare, Share2, BookOpen } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Code2 },
  { href: '/visualizer', label: 'Visualizer', icon: Code2 },
  { href: '/complexity', label: 'Complexity', icon: BarChart2 },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/graph', label: 'Graph', icon: Share2 },
  { href: '/resources', label: 'Resources', icon: BookOpen }
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Visify</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.slice(1).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
          <div className="md:hidden flex items-center gap-1">
            {navItems.slice(1).map(({ href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`p-2 rounded-md transition-colors ${
                  pathname === href ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
