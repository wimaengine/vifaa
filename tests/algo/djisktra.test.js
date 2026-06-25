import test from 'node:test'
import assert from 'node:assert/strict'

import { Graph } from '../../dist/index.module.js'
import { dijkstra } from '../../dist/index.module.js'

test('dijkstra computes shortest path and costs', () => {
  const graph = new Graph(true)
  const a = graph.addNode(0)
  const b = graph.addNode(3)
  const c = graph.addNode(1)
  const d = graph.addNode(2)
  const edgeCost = (edgeId) => graph.getEdge(edgeId).weight

  graph.addEdge(a, b, 3) // cost 3
  graph.addEdge(a, c, 1) // cost 1
  graph.addEdge(c, d, 1) // cost 1
  graph.addEdge(d, b, 1) // cost 1 -> total 3 (ties direct)

  const path = dijkstra(graph, edgeCost, a, b)

  assert.equal(path.get(a)?.gCost, 0)
  assert.equal(path.get(b)?.gCost, 3)
  assert.deepEqual(path.path(b), [a, b])
})

test('dijkstra without end explores reachable nodes', () => {
  const graph = new Graph(true)
  const a = graph.addNode(1)
  const b = graph.addNode(2)
  const c = graph.addNode(5)
  const edgeCost = (edgeId) => graph.getEdge(edgeId).weight

  graph.addEdge(a, b, 2)
  graph.addEdge(b, c, 2)

  const path = dijkstra(graph, edgeCost, a)

  assert.equal(path.has(a), true)
  assert.equal(path.has(b), true)
  assert.equal(path.has(c), true)
  assert.equal(path.get(c)?.gCost, 4)
})
