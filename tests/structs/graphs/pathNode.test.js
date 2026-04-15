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
