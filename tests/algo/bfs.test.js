import test from 'node:test'
import assert from 'node:assert/strict'

import { Graph } from '../../dist/index.module.js'
import { bfs } from '../../dist/index.module.js'

test('bfs visits nodes in breadth-first order', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')
  const d = graph.addNode('D')

  graph.addEdge(a, b, 1)
  graph.addEdge(a, c, 1)
  graph.addEdge(c, d, 1)

  const visited = []
  bfs(graph, a, (id) => visited.push(id))

  // adjacency iteration is LIFO by insertion on this graph structure
  assert.deepEqual(visited, [a, c, b, d])
})

test('bfs does not revisit nodes in cycles', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')

  graph.addEdge(a, b, 1)
  graph.addEdge(b, c, 1)
  graph.addEdge(c, a, 1)

  const visited = []
  bfs(graph, a, (id) => visited.push(id))

  assert.equal(new Set(visited).size, 3)
  assert.equal(visited.length, 3)
})
