import test from 'node:test'
import assert from 'node:assert/strict'

import { Graph } from '../../dist/index.module.js'
import { aStar } from '../../dist/index.module.js'

const diffCost = (a, b) => Math.abs(a - b)

test('aStar returns a valid shortest path for weighted graph', () => {
  const graph = new Graph(true)
  const start = graph.addNode(0)
  const mid = graph.addNode(1)
  const detour = graph.addNode(10)
  const end = graph.addNode(2)

  graph.addEdge(start, mid, 1)
  graph.addEdge(mid, end, 1)
  graph.addEdge(start, detour, 1)
  graph.addEdge(detour, end, 1)

  const path = aStar(graph, diffCost, start, end)

  assert.equal(path.get(end)?.gCost, 2)
  assert.deepEqual(path.path(end), [start, mid, end])
})

test('aStar returns empty path when target node does not exist', () => {
  const graph = new Graph(true)
  const start = graph.addNode(0)

  const path = aStar(graph, diffCost, start, 999)

  assert.equal(path.has(start), false)
  assert.deepEqual(path.path(start), [])
})
