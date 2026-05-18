import test from 'node:test'
import assert from 'node:assert/strict'

import { Graph } from '../../../dist/index.module.js'

test('Graph constructor stores directed flag', () => {
  const graph = new Graph(true)
  assert.equal(graph.directed, true)
})

test('Graph addNode returns sequential ids', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')

  assert.equal(a, 0)
  assert.equal(b, 1)
  assert.equal(c, 2)
})

test('Graph addEdge increases edge count', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')

  graph.addEdge(a, b, 1)

  assert.equal(graph.getEdgeCount(), 1)
})

test('Graph node and edge counts reflect inserted elements', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  graph.addEdge(a, b, 1)

  assert.equal(graph.getNodeCount(), 2)
  assert.equal(graph.getEdgeCount(), 1)
})

test('Graph getNodeWeight returns stored node weight', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  assert.equal(graph.getNodeWeight(a), 'A')
})

test('Graph getEdgeWeight returns stored edge weight', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const edge = graph.addEdge(a, b, 7)

  assert.equal(graph.getEdgeWeight(edge), 7)
})

test('Graph hasEdge returns true for existing node pairs', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  graph.addEdge(a, b, 1)

  assert.equal(graph.hasEdge(a, b), true)
})

test('Graph hasEdge return false for missing ids', () => {
  const graph = new Graph(true)

  assert.equal(graph.hasEdge(0, 1), false)
})

test('Graph setNodeWeight updates node value', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')

  graph.setNodeWeight(a, 'AA')

  assert.equal(graph.getNodeWeight(a), 'AA')
})

test('Graph setEdgeWeight updates edge value', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const edge = graph.addEdge(a, b, 1)

  graph.setEdgeWeight(edge, 9)

  assert.equal(graph.getEdgeWeight(edge), 9)
})

test('Graph getNeighbours returns connected node ids', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')

  graph.addEdge(a, b, 1)
  graph.addEdge(a, c, 2)

  assert.deepEqual([...graph.getNeighbours(a)], [c, b])
})

test('Graph getNodeEdges returns outgoing edges for a node', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')

  graph.addEdge(a, b, 1)
  graph.addEdge(a, c, 2)

  assert.equal([...graph.getNodeEdges(a)].length, 2)
})

test('Graph removeEdge on head edge keeps remaining neighbour reachable', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')

  const e1 = graph.addEdge(a, b, 1)
  graph.addEdge(a, b, 2)

  graph.removeEdge(e1)

  assert.equal([...graph.getNeighbours(a)].length, 1)
})

test('Graph removeEdge from middle shrinks edge count by one', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')

  graph.addEdge(a, b, 1)
  const e2 = graph.addEdge(a, c, 2)
  graph.addEdge(b, c, 3)

  const originalEdgeCount = graph.getEdgeCount()
  graph.removeEdge(e2)

  assert.equal(graph.getEdgeCount(), originalEdgeCount - 1)
})

test('Graph removeEdge maintains valid edge node references', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')

  graph.addEdge(a, b, 1)
  const e2 = graph.addEdge(a, c, 2)
  graph.addEdge(b, c, 3)
  graph.removeEdge(e2)

  for (const edge of graph.getEdges()) {
    assert.ok(edge.from < graph.getNodeCount())
    assert.ok(edge.to < graph.getNodeCount())
  }
})

test('Graph removeNode with connected edges reduces node count', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')
  const d = graph.addNode('D')

  graph.addEdge(a, b, 1)
  graph.addEdge(b, c, 2)
  graph.addEdge(c, d, 3)
  graph.addEdge(a, d, 4)
  graph.addEdge(d, b, 5)

  const originalNodeCount = graph.getNodeCount()
  graph.removeNode(b)

  assert.equal(graph.getNodeCount(), originalNodeCount - 1)
})

test('Graph removeNode keeps edge references within valid node range', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')
  const d = graph.addNode('D')

  graph.addEdge(a, b, 1)
  graph.addEdge(b, c, 2)
  graph.addEdge(c, d, 3)
  graph.addEdge(a, d, 4)
  graph.addEdge(d, b, 5)

  graph.removeNode(b)

  for (const edge of graph.getEdges()) {
    assert.ok(edge.from < graph.getNodeCount())
    assert.ok(edge.to < graph.getNodeCount())
  }
})

test('Graph removeNode on last node removes dangling connected edge', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')

  graph.addEdge(a, b, 1)
  graph.removeNode(b)

  assert.equal(graph.getEdgeCount(), 0)
})

test('Graph removeNode on last node leaves expected node count', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')

  graph.addEdge(a, b, 1)
  graph.removeNode(b)

  assert.equal(graph.getNodeCount(), 1)
})

test('Graph removeEdge returns false for non-existent id', () => {
  const graph = new Graph(true)
  assert.equal(graph.removeEdge(0), false)
})

test('Graph removeNode returns false for non-existent id', () => {
  const graph = new Graph(true)
  assert.equal(graph.removeNode(0), false)
})

test('Graph hasEdge reflect removals', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const edge = graph.addEdge(a, b, 1)

  graph.removeEdge(edge)
  graph.removeNode(b)

  assert.equal(graph.hasEdge(a, b), false)
})

test('Graph hasEdge respects edge direction', () => {
  const graph = new Graph(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')

  graph.addEdge(a, b, 1)

  assert.equal(graph.hasEdge(a, b), true)
  assert.equal(graph.hasEdge(b, a), false)
})
