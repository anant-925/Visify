import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navigation/Navbar';

export const metadata: Metadata = {
  title: 'Visify - Interactive Code Visualizer',
  description: 'Visualize code execution and analyze algorithm complexity step by step.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-950 text-gray-100 min-h-screen">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}
