import test from 'node:test'
import assert from 'node:assert/strict'

import { GraphPathNode } from '../../../dist/index.module.js'

test('GraphPathNode default constructor initializes empty values', () => {
  const node = new GraphPathNode()

  assert.equal(node.parent, undefined)
  assert.equal(node.gCost, 0)
  assert.equal(node.hCost, 0)
})

test('GraphPathNode constructor stores provided values', () => {
  const node = new GraphPathNode(3, 4, 6)

  assert.equal(node.parent, 3)
  assert.equal(node.gCost, 4)
  assert.equal(node.hCost, 6)
})

test('GraphPathNode fCost returns gCost + hCost', () => {
  const node = new GraphPathNode(undefined, 4, 6)

  assert.equal(node.fCost(), 10)
})

test('GraphPathNode serialize returns plain data', () => {
  const node = new GraphPathNode(3, 4, 6)

  assert.deepEqual(node.serialize(), {
    parent: 3,
    gCost: 4,
    hCost: 6
  })
})

test('GraphPathNode deserialize restores data into an existing node', () => {
  const out = new GraphPathNode()

  const node = GraphPathNode.deserialize({
    parent: 8,
    gCost: 11,
    hCost: 13
  }, out)

  assert.equal(node, out)
  assert.equal(node.parent, 8)
  assert.equal(node.gCost, 11)
  assert.equal(node.hCost, 13)
})

test('GraphPathNode validateSerial accepts the expected shape', () => {
  assert.equal(GraphPathNode.validateSerial({
    parent: 2,
    gCost: 3,
    hCost: 5
  }), true)
})

test('GraphPathNode validateSerial rejects malformed data', () => {
  assert.equal(GraphPathNode.validateSerial({
    parent: '2',
    gCost: 3,
    hCost: 5
  }), false)
})
