import test from 'node:test'
import assert from 'node:assert/strict'

import { StableGraph } from '../../../dist/index.module.js'

test('StableGraph serialize returns plain data', () => {
  const graph = new StableGraph(true)
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

test('StableGraph validSerial accepts the expected shape', () => {
  assert.equal(StableGraph.validSerial({
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

test('StableGraph deserialize restores sparse ids', () => {
  const graph = StableGraph.deserialize({
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
