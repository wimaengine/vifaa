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
    nodes: {
      0: {
        edges: [0],
        weight: 'A'
      },
      1: {
        edges: [],
        weight: 'B'
      }
    },
    edges: {
      0: {
        from: a,
        to: b,
        weight: 7
      }
    }
  })
})

test('GraphMap validateSerial accepts the expected shape', () => {
  assert.equal(GraphMap.validateSerial({
    directed: true,
    nodes: {
      0: {
        edges: [0],
        weight: 'A'
      }
    },
    edges: {
      0: {
        from: 0,
        to: 0,
        weight: 2
      }
    }
  }), true)
})

test('GraphMap deserialize restores sparse ids', () => {
  const graph = GraphMap.deserialize({
    directed: true,
    nodes: {
      2: {
        edges: [5],
        weight: 'A'
      },
      5: {
        edges: [],
        weight: 'B'
      }
    },
    edges: {
      5: {
        from: 2,
        to: 5,
        weight: 7
      }
    }
  })

  assert.equal(graph.getNodeWeight(2), 'A')
  assert.equal(graph.getNodeWeight(5), 'B')
  assert.equal(graph.getEdgeWeight(5), 7)
  assert.equal(graph.findEdgeId(2, 5), 5)
  assert.equal(graph.addNode('C'), 0)
  assert.equal(graph.addEdge(2, 0, 9), 0)
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
