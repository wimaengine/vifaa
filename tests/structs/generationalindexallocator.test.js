import test from 'node:test'
import assert from 'node:assert/strict'

import { GenerationalIndexAllocator } from '../../dist/index.module.js'

test('GenerationalIndexAllocator reserve returns a packed id on first allocation', () => {
  const allocator = new GenerationalIndexAllocator()
  assert.equal(allocator.reserve(), 4294967296)
})

test('GenerationalIndexAllocator reserve packs the index with generation 1', () => {
  const allocator = new GenerationalIndexAllocator()

  allocator.reserve()

  assert.equal(allocator.reserve(), 4294967297)
})

test('GenerationalIndexAllocator count tracks highest allocated id', () => {
  const allocator = new GenerationalIndexAllocator()

  allocator.reserve()
  allocator.reserve()
  allocator.reserve()

  assert.equal(allocator.count(), 2)
})

test('GenerationalIndexAllocator reserve increments the generation of recycled ids', () => {
  const allocator = new GenerationalIndexAllocator()
  const id = allocator.reserve()

  allocator.recycle(id)

  assert.equal(allocator.reserve(), 8589934592)
})

test('GenerationalIndexAllocator recycled ids are consumed in LIFO order', () => {
  const allocator = new GenerationalIndexAllocator()
  const a = allocator.reserve()
  const b = allocator.reserve()

  allocator.recycle(a)
  allocator.recycle(b)

  assert.equal(allocator.reserve(), 8589934593)
  assert.equal(allocator.reserve(), 8589934592)
})

test('GenerationalIndexAllocator increments generation each time the same index is recycled', () => {
  const allocator = new GenerationalIndexAllocator()
  const first = allocator.reserve()

  allocator.recycle(first)

  const second = allocator.reserve()
  allocator.recycle(second)

  const third = allocator.reserve()

  assert.equal(first, 4294967296)
  assert.equal(second, 8589934592)
  assert.equal(third, 12884901888)
})
