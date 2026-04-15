import test from 'node:test'
import assert from 'node:assert/strict'

import { Graph } from '../../dist/index.module.js'
import { kahnTopologySort } from '../../dist/index.module.js'

test('kahnTopologySort returns a valid order for DAG', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')
  const d = graph.addNode('D')

  graph.addEdge(a, b, 1)
  graph.addEdge(a, c, 1)
  graph.addEdge(b, d, 1)
  graph.addEdge(c, d, 1)

  const sorted = kahnTopologySort(graph)

  assert.ok(sorted)

  const pos = new Map(sorted.map((nodeId, index) => [nodeId, index]))
  for (const edge of graph.getEdges()) {
    assert.ok(pos.get(edge.from) < pos.get(edge.to))
  }
})

test('kahnTopologySort returns undefined for cyclic graph', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')

  graph.addEdge(a, b, 1)
  graph.addEdge(b, a, 1)

  assert.equal(kahnTopologySort(graph), undefined)
})
