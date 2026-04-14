import test from 'node:test'
import assert from 'node:assert/strict'

import { Graph } from '../../dist/index.module.js'
import { dfs } from '../../dist/index.module.js'

test('dfs traverses depth-first with stack behavior', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')
  const d = graph.addNode('D')

  graph.addEdge(a, b, 1)
  graph.addEdge(a, c, 1)
  graph.addEdge(c, d, 1)

  const visited = []
  dfs(graph, a, (id) => visited.push(id))

  assert.deepEqual(visited, [a, b, c, d])
})

test('dfs handles self-loop without infinite traversal', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  graph.addEdge(a, a, 1)

  const visited = []
  dfs(graph, a, (id) => visited.push(id))

  assert.deepEqual(visited, [a])
})
