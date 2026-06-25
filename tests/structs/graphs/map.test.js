import test from 'node:test'
import assert from 'node:assert/strict'

import { GraphMap, bfs } from '../../../dist/index.module.js'

test('GraphMap stores directed flag', () => {
  const graph = new GraphMap(true)

  assert.equal(graph.directed, true)
})

test('GraphMap addNode returns sequential ids', () => {
  const graph = new GraphMap(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const c = graph.addNode('C')

  assert.equal(a, 0)
  assert.equal(b, 1)
  assert.equal(c, 2)
})

test('GraphMap addEdge connects nodes and increases edge count', () => {
  const graph = new GraphMap(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')

  const edge = graph.addEdge(a, b, 7)

  assert.equal(graph.getEdgeCount(), 1)
  assert.equal(graph.getEdgeWeight(edge), 7)
  assert.equal(graph.findEdgeId(a, b), edge)
  assert.equal(graph.hasEdge(a, b), true)
})

test('GraphMap serialize returns plain data', () => {
  const graph = new GraphMap(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  graph.addEdge(a, b, 7)

  assert.deepEqual(graph.serialize(), {
    directed: true,
    nodes: [
      {
        next: [0, undefined],
        weight: 'A'
      },
      {
        next: [undefined, 0],
        weight: 'B'
      }
    ],
    edges: [
      {
        from: a,
        to: b,
        next: [undefined, undefined],
        weight: 7
      }
    ]
  })
})

test('GraphMap validSerial accepts the expected shape', () => {
  assert.equal(GraphMap.validSerial({
    directed: true,
    nodes: [
      {
        next: [0, undefined],
        weight: 'A'
      }
    ],
    edges: [
      {
        from: 0,
        to: 1,
        next: [undefined, undefined],
        weight: 2
      }
    ]
  }), true)
})

test('GraphMap deserialize restores data into an existing graph', () => {
  const source = new GraphMap(true)
  const a = source.addNode('A')
  const b = source.addNode('B')
  source.addEdge(a, b, 7)

  const out = new GraphMap(true)
  const graph = GraphMap.deserialize(source.serialize(), out)

  assert.equal(graph, out)
  assert.equal(graph.directed, true)
  assert.equal(graph.getNodeCount(), 2)
  assert.equal(graph.getEdgeCount(), 1)
  assert.equal(graph.getNodeWeight(0), 'A')
  assert.equal(graph.getNodeWeight(1), 'B')
  assert.equal(graph.getEdgeWeight(0), 7)
  assert.equal(graph.findEdgeId(0, 1), 0)
})

test('GraphMap keeps surviving node and edge ids stable after removal', () => {
  const graph = new GraphMap(true)
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

test('GraphMap reuses freed node and edge ids', () => {
  const graph = new GraphMap(true)
  const a = graph.addNode('A')
  const b = graph.addNode('B')
  const edge = graph.addEdge(a, b, 1)

  graph.removeEdge(edge)
  graph.removeNode(b)

  assert.equal(graph.addNode('C'), b)
  assert.equal(graph.addEdge(a, b, 2), edge)
})
