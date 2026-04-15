import test from 'node:test'
import assert from 'node:assert/strict'

import { IndexAllocator } from '../../dist/index.module.js'

test('IndexAllocator reserve returns 0 on first allocation', () => {
  const allocator = new IndexAllocator()
  assert.equal(allocator.reserve(), 0)
})

test('IndexAllocator reserve increments for new allocations', () => {
  const allocator = new IndexAllocator()
  allocator.reserve()
  assert.equal(allocator.reserve(), 1)
})

test('IndexAllocator count tracks highest allocated id', () => {
  const allocator = new IndexAllocator()
  allocator.reserve()
  allocator.reserve()
  allocator.reserve()

  assert.equal(allocator.count(), 2)
})

test('IndexAllocator reserve reuses a recycled id', () => {
  const allocator = new IndexAllocator()
  const id = allocator.reserve()

  allocator.recycle(id)

  assert.equal(allocator.reserve(), id)
})

test('IndexAllocator recycled ids are consumed in LIFO order', () => {
  const allocator = new IndexAllocator()
  const a = allocator.reserve()
  const b = allocator.reserve()

  allocator.recycle(a)
  allocator.recycle(b)

  assert.equal(allocator.reserve(), b)
  assert.equal(allocator.reserve(), a)
})
