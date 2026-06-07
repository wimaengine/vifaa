import test from 'node:test'
import assert from 'node:assert/strict'

import { DenseList, IndexAllocator } from '../../dist/index.module.js'

test('DenseList push returns a numeric index', () => {
  const list = new DenseList(new IndexAllocator())
  const id = list.push('first')

  assert.equal(typeof id, 'number')
})

test('DenseList get returns value at pushed index', () => {
  const list = new DenseList(new IndexAllocator())
  const id = list.push('first')

  assert.equal(list.get(id), 'first')
})

test('DenseList set updates value at an allocated index', () => {
  const list = new DenseList(new IndexAllocator())
  const id = list.push('first')

  list.set(id, 'updated')

  assert.equal(list.get(id), 'updated')
})

test('DenseList reserve returns a numeric index', () => {
  const list = new DenseList(new IndexAllocator())

  assert.equal(typeof list.reserve(), 'number')
})

test('DenseList recycle makes an index available again', () => {
  const list = new DenseList(new IndexAllocator())
  const id = list.reserve()

  list.recycle(id)

  assert.equal(list.reserve(), id)
})

test('DenseList values includes pushed elements', () => {
  const list = new DenseList(new IndexAllocator())
  list.push('A')
  list.push('B')

  assert.equal(list.values()[0], 'A')
})

test('DenseList set on never-allocated index throws', () => {
  const list = new DenseList(new IndexAllocator())

  assert.throws(() => list.set(1, 'x'), /never been allocated/)
})

test('DenseList does not write value when set throws on never-allocated index', () => {
  const list = new DenseList(new IndexAllocator())
  assert.throws(() => list.set(1, 'x'), /never been allocated/)

  assert.equal(list.get(1), undefined)
})
