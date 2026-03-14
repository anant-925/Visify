const express = require('express');
const router = express.Router();

const ALGORITHM_LIBRARY = [
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'sorting',
    language: 'python',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: 'Repeatedly swaps adjacent elements that are in the wrong order.',
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

arr = [64, 34, 25, 12, 22, 11, 90]
result = bubble_sort(arr)
print(result)`
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'searching',
    language: 'python',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    description: 'Efficiently finds a target value within a sorted array by halving the search space.',
    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

arr = [1, 3, 5, 7, 9, 11, 13, 15]
result = binary_search(arr, 7)
print(result)`
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci (Recursive)',
    category: 'recursion',
    language: 'python',
    timeComplexity: 'O(2^n)',
    spaceComplexity: 'O(n)',
    description: 'Naive recursive Fibonacci with exponential time complexity.',
    code: `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

result = fib(6)
print(result)`
  },
  {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'searching',
    language: 'python',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    description: 'Scans each element one by one until the target is found.',
    code: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1

arr = [10, 20, 30, 40, 50]
result = linear_search(arr, 30)
print(result)`
  },
  {
    id: 'selection-sort',
    name: 'Selection Sort',
    category: 'sorting',
    language: 'python',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: 'Finds the minimum element and places it at the beginning in each iteration.',
    code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr

arr = [64, 25, 12, 22, 11]
result = selection_sort(arr)
print(result)`
  },
  {
    id: 'factorial',
    name: 'Factorial (Recursive)',
    category: 'recursion',
    language: 'python',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    description: 'Computes n! using recursion.',
    code: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(result)`
  },
  {
    id: 'sum-array',
    name: 'Sum Array',
    category: 'basics',
    language: 'python',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    description: 'Sums all elements in an array with a single loop.',
    code: `def sum_array(arr):
    total = 0
    for i in range(len(arr)):
        total += arr[i]
    return total

arr = [1, 2, 3, 4, 5]
result = sum_array(arr)
print(result)`
  },
  {
    id: 'count-digits',
    name: 'Count Digits',
    category: 'basics',
    language: 'c',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    description: 'Counts digits in an integer using repeated division.',
    code: `#include <stdio.h>

int countDigits(int n) {
    int count = 0;
    while (n != 0) {
        n = n / 10;
        count++;
    }
    return count;
}

int main() {
    int result = countDigits(12345);
    printf("Digits: %d\\n", result);
    return 0;
}`
  },
  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'sorting',
    language: 'python',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: 'Builds the sorted array one element at a time by inserting each element into its correct position.',
    code: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr

arr = [12, 11, 13, 5, 6]
result = insertion_sort(arr)
print(result)`
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'sorting',
    language: 'python',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    description: 'Divide-and-conquer sort that splits, recursively sorts, then merges two halves.',
    code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result += [left[i]]
            i += 1
        else:
            result += [right[j]]
            j += 1
    result += left[i:]
    result += right[j:]
    return result

arr = [38, 27, 43, 3]
sorted_arr = merge_sort(arr)
print(sorted_arr)`
  }
];

router.get('/', (req, res) => {
  const { category, language } = req.query;
  let results = [...ALGORITHM_LIBRARY];
  if (category) results = results.filter(a => a.category === category);
  if (language) results = results.filter(a => a.language === language);
  res.json({ algorithms: results, total: results.length });
});

router.get('/:id', (req, res) => {
  const algo = ALGORITHM_LIBRARY.find(a => a.id === req.params.id);
  if (!algo) return res.status(404).json({ error: 'Algorithm not found' });
  res.json(algo);
});

module.exports = router;
