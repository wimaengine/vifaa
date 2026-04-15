import test from 'node:test'
import assert from 'node:assert/strict'

import { PriorityQueue } from '../../dist/index.module.js'

test('PriorityQueue starts empty', () => {
  const queue = new PriorityQueue()

  assert.equal(queue.isEmpty(), true)
  assert.equal(queue.size(), 0)
})

test('PriorityQueue push returns updated size', () => {
  const queue = new PriorityQueue()

  assert.equal(queue.push(2, 7, 4), 3)
})

test('PriorityQueue default comparator places largest element at top', () => {
  const queue = new PriorityQueue()
  queue.push(2, 7, 4)

  assert.equal(queue.peek(), 7)
})

test('PriorityQueue pop returns elements in max-heap order', () => {
  const queue = new PriorityQueue()
  queue.push(2, 7, 4)

  assert.equal(queue.pop(), 7)
  assert.equal(queue.pop(), 4)
  assert.equal(queue.pop(), 2)
})

test('PriorityQueue pop returns undefined when queue is empty', () => {
  const queue = new PriorityQueue()

  assert.equal(queue.pop(), undefined)
})

test('PriorityQueue custom comparator can create min-heap behavior', () => {
  const queue = new PriorityQueue((a, b) => a < b)
  queue.push(5, 1, 3)

  assert.equal(queue.pop(), 1)
  assert.equal(queue.pop(), 3)
  assert.equal(queue.pop(), 5)
})

test('PriorityQueue replace returns previous head', () => {
  const queue = new PriorityQueue()
  queue.push(10, 3, 5)

  assert.equal(queue.replace(4), 10)
})

test('PriorityQueue replace re-heaps queue correctly', () => {
  const queue = new PriorityQueue()
  queue.push(10, 3, 5)

  queue.replace(4)

  assert.equal(queue.pop(), 5)
  assert.equal(queue.pop(), 4)
  assert.equal(queue.pop(), 3)
})
