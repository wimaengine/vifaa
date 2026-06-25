import test from 'node:test'
import assert from 'node:assert/strict'

import { StableGraph } from '../../../dist/index.module.js'

test('StableGraph keeps surviving node and edge ids stable after removal', () => {
  const graph = new StableGraph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')
  const d = graph.addNode('D')

  const ab = graph.addEdge(a, b, 1)
  const cd = graph.addEdge(c, d, 2)

  graph.removeNode(b)

  assert.equal(graph.getNode(a)?.weight, 'A')
  assert.equal(graph.getNode(c)?.weight, 'C')
  assert.equal(graph.getNode(d)?.weight, 'D')
  assert.equal(graph.getNode(b), undefined)
  assert.equal(graph.getEdge(ab), undefined)
  assert.equal(graph.getEdge(cd)?.weight, 2)
  assert.equal(graph.findEdgeId(c, d), cd)
  assert.equal(graph.getNodeCount(), 3)
  assert.equal(graph.getEdgeCount(), 1)
})

test('StableGraph reuses freed node and edge ids', () => {
  const graph = new StableGraph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const edge = graph.addEdge(a, b, 1)

  graph.removeEdge(edge)
  graph.removeNode(b)

  assert.equal(graph.addNode('C'), b)
  assert.equal(graph.addEdge(a, b, 2), edge)
})
