import test from 'node:test'
import assert from 'node:assert/strict'

import { GraphPath, GraphPathNode } from '../../../dist/index.module.js'

test('GraphPath set stores and returns the same node', () => {
  const path = new GraphPath()
  const node = new GraphPathNode(undefined, 2, 1)

  const returned = path.set(0, node)

  assert.equal(returned, node)
  assert.equal(path.get(0), node)
})

test('GraphPath get returns undefined for missing key', () => {
  const path = new GraphPath()

  assert.equal(path.get(99), undefined)
})

test('GraphPath has returns true only for existing key', () => {
  const path = new GraphPath()
  path.set(1, new GraphPathNode())

  assert.equal(path.has(1), true)
  assert.equal(path.has(2), false)
})

test('GraphPath delete removes an existing key', () => {
  const path = new GraphPath()
  path.set(1, new GraphPathNode())

  path.delete(1)

  assert.equal(path.has(1), false)
})

test('GraphPath getOrSet returns existing node without replacing it', () => {
  const path = new GraphPath()
  const existing = new GraphPathNode(0, 2, 3)
  path.set(2, existing)

  const result = path.getOrSet(2)

  assert.equal(result, existing)
})

test('GraphPath getOrSet creates a default node for missing key', () => {
  const path = new GraphPath()

  const created = path.getOrSet(9)

  assert.equal(path.has(9), true)
  assert.equal(created.parent, undefined)
  assert.equal(created.gCost, 0)
  assert.equal(created.hCost, 0)
})

test('GraphPath path reconstructs chain from parent pointers', () => {
  const path = new GraphPath()
  path.set(0, new GraphPathNode(undefined, 0, 0))
  path.set(1, new GraphPathNode(0, 1, 0))
  path.set(2, new GraphPathNode(1, 2, 0))

  assert.deepEqual(path.path(2), [0, 1, 2])
})

test('GraphPath path returns empty array when id is missing', () => {
  const path = new GraphPath()

  assert.deepEqual(path.path(123), [])
})

test('GraphPath forEach iterates all stored entries', () => {
  const path = new GraphPath()
  path.set(5, new GraphPathNode(undefined, 1, 2))
  path.set(6, new GraphPathNode(5, 2, 3))

  const ids = []
  const costs = []

  path.forEach((id, node) => {
    ids.push(id)
    costs.push(node.gCost)
  })

  assert.deepEqual(ids.sort((a, b) => a - b), [5, 6])
  assert.deepEqual(costs.sort((a, b) => a - b), [1, 2])
})
