'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ComplexityChartProps {
  highlighted?: string;
}

const COMPLEXITIES = [
  { label: 'O(1)', fn: () => 1, color: '#10b981' },
  { label: 'O(log n)', fn: (n: number) => Math.log2(n + 1), color: '#22c55e' },
  { label: 'O(n)', fn: (n: number) => n, color: '#eab308' },
  { label: 'O(n log n)', fn: (n: number) => n * Math.log2(n + 1), color: '#f97316' },
  { label: 'O(n²)', fn: (n: number) => n * n, color: '#ef4444' },
  { label: 'O(2^n)', fn: (n: number) => Math.pow(2, n), color: '#a855f7' },
];

export default function ComplexityChart({ highlighted }: ComplexityChartProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const width = ref.current.clientWidth - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;
    const N = 20;
    const xs = d3.range(1, N + 1);

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([1, N]).range([0, width]);
    const yMax = N * 2;
    const yScale = d3.scaleLinear().domain([0, yMax]).range([height, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(5))
      .join('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', '#374151').attr('stroke-dasharray', '3,3');

    // Axes
    g.append('g').attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text').attr('fill', '#9ca3af');
    g.selectAll('.domain,.tick line').attr('stroke', '#4b5563');

    g.append('g').call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text').attr('fill', '#9ca3af');

    // Axis labels
    g.append('text').attr('x', width / 2).attr('y', height + 35)
      .attr('text-anchor', 'middle').attr('fill', '#6b7280').attr('font-size', 12).text('n (input size)');
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -40)
      .attr('text-anchor', 'middle').attr('fill', '#6b7280').attr('font-size', 12).text('Operations');

    // Lines
    COMPLEXITIES.forEach(({ label, fn, color }) => {
      const isHighlighted = highlighted && label === highlighted;
      const opacity = highlighted ? (isHighlighted ? 1 : 0.2) : 1;
      const strokeWidth = isHighlighted ? 3 : 1.5;

      const lineFn = d3.line<number>()
        .x(n => xScale(n))
        .y(n => yScale(Math.min(yMax, fn(n))))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(xs)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', strokeWidth)
        .attr('opacity', opacity)
        .attr('d', lineFn);
    });

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${width + margin.left + 8},${margin.top})`);
    COMPLEXITIES.forEach(({ label, color }, i) => {
      const isHighlighted = highlighted && label === highlighted;
      const opacity = highlighted ? (isHighlighted ? 1 : 0.3) : 1;
      legend.append('rect').attr('x', 0).attr('y', i * 20).attr('width', 12).attr('height', 3)
        .attr('fill', color).attr('opacity', opacity);
      legend.append('text').attr('x', 16).attr('y', i * 20 + 5)
        .attr('fill', color).attr('font-size', 11).attr('opacity', opacity)
        .attr('font-family', 'monospace').text(label);
    });
  }, [highlighted]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-4">Growth Comparison</h3>
      <svg ref={ref} className="w-full" />
    </div>
  );
}
