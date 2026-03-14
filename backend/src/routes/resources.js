const express = require('express');
const router = express.Router();

const RESOURCES = [
  {
    id: 'r1',
    title: 'Introduction to Big-O Notation',
    description: 'Learn how to measure algorithm efficiency using Big-O notation.',
    url: 'https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/big-big-o-notation',
    tags: ['complexity', 'big-o', 'beginner'],
    type: 'article'
  },
  {
    id: 'r2',
    title: 'Sorting Algorithms Visualized',
    description: 'Visual comparison of bubble, selection, insertion, merge, and quicksort.',
    url: 'https://visualgo.net/en/sorting',
    tags: ['sorting', 'visualization', 'intermediate'],
    type: 'interactive'
  },
  {
    id: 'r3',
    title: 'Binary Search Explained',
    description: 'Deep dive into binary search algorithm with examples.',
    url: 'https://www.geeksforgeeks.org/binary-search/',
    tags: ['searching', 'binary-search', 'beginner'],
    type: 'article'
  },
  {
    id: 'r4',
    title: 'Recursion and the Call Stack',
    description: 'Understand how recursion works under the hood with stack frames.',
    url: 'https://www.cs.usfca.edu/~galles/visualization/RecFact.html',
    tags: ['recursion', 'stack', 'visualization'],
    type: 'interactive'
  },
  {
    id: 'r5',
    title: 'Graph Algorithms: BFS and DFS',
    description: 'Breadth-first search and depth-first search with step-by-step walkthrough.',
    url: 'https://visualgo.net/en/dfsbfs',
    tags: ['graph', 'bfs', 'dfs', 'intermediate'],
    type: 'interactive'
  },
  {
    id: 'r6',
    title: 'Dynamic Programming Patterns',
    description: 'Common DP patterns: memoization, tabulation, 0/1 knapsack.',
    url: 'https://www.geeksforgeeks.org/dynamic-programming/',
    tags: ['dynamic-programming', 'optimization', 'advanced'],
    type: 'article'
  },
  {
    id: 'r7',
    title: 'The Master Theorem',
    description: 'Analyze divide-and-conquer recurrences with the Master Theorem.',
    url: 'https://en.wikipedia.org/wiki/Master_theorem_(analysis_of_algorithms)',
    tags: ['complexity', 'recurrence', 'advanced'],
    type: 'article'
  },
  {
    id: 'r8',
    title: 'Data Structures Overview',
    description: 'Arrays, linked lists, trees, graphs, and hash tables explained.',
    url: 'https://www.geeksforgeeks.org/data-structures/',
    tags: ['data-structures', 'beginner'],
    type: 'article'
  },
  {
    id: 'r9',
    title: 'Merge Sort In-Depth',
    description: 'Step-by-step explanation of merge sort with complexity proof.',
    url: 'https://www.geeksforgeeks.org/merge-sort/',
    tags: ['sorting', 'merge-sort', 'intermediate'],
    type: 'article'
  },
  {
    id: 'r10',
    title: 'Dijkstra\'s Shortest Path',
    description: 'Understand Dijkstra\'s algorithm with animated examples.',
    url: 'https://visualgo.net/en/sssp',
    tags: ['graph', 'shortest-path', 'advanced'],
    type: 'interactive'
  }
];

router.get('/', (req, res) => {
  const { tag, type } = req.query;
  let results = [...RESOURCES];
  if (tag) results = results.filter(r => r.tags.includes(tag));
  if (type) results = results.filter(r => r.type === type);
  res.json({ resources: results, total: results.length });
});

router.get('/:id', (req, res) => {
  const resource = RESOURCES.find(r => r.id === req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });
  res.json(resource);
});

module.exports = router;
