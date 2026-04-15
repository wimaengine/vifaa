import test from 'node:test'
import assert from 'node:assert/strict'

import { Bitset } from '../../dist/index.module.js'

test('Bitset length matches constructor size', () => {
  const bitset = new Bitset(8)
  assert.equal(bitset.length(), 8)
})

test('Bitset set marks a bit as true', () => {
  const bitset = new Bitset(8)
  bitset.set(0)

  assert.equal(bitset.get(0), true)
})

test('Bitset reset marks a set bit as false', () => {
  const bitset = new Bitset(8)
  bitset.set(3)
  bitset.reset(3)

  assert.equal(bitset.get(3), false)
})

test('Bitset clear resets first bit', () => {
  const bitset = new Bitset(8)
  bitset.set(0)
  bitset.clear()

  assert.equal(bitset.get(0), false)
})

test('Bitset clear resets another set bit', () => {
  const bitset = new Bitset(8)
  bitset.set(3)
  bitset.clear()

  assert.equal(bitset.get(3), false)
})

test('Bitset resize updates visible length', () => {
  const bitset = new Bitset(4)
  bitset.resize(64)

  assert.equal(bitset.length(), 64)
})

test('Bitset resize preserves existing data', () => {
  const bitset = new Bitset(4)
  bitset.set(1)
  bitset.resize(64)

  assert.equal(bitset.get(1), true)
})

test('Bitset allows setting bits in expanded area after resize', () => {
  const bitset = new Bitset(4)
  bitset.resize(64)
  bitset.set(40)

  assert.equal(bitset.get(40), true)
})

test('Bitset.and keeps only common bits', () => {
  const a = new Bitset(8)
  const b = new Bitset(8)
  a.set(1)
  a.set(2)
  b.set(2)
  b.set(3)

  const andResult = Bitset.and(a, b)

  assert.equal(andResult.get(2), true)
  assert.equal(andResult.get(1), false)
})

test('Bitset.or combines bits from both sets', () => {
  const a = new Bitset(8)
  const b = new Bitset(8)
  a.set(1)
  b.set(3)

  const orResult = Bitset.or(a, b)

  assert.equal(orResult.get(1), true)
  assert.equal(orResult.get(3), true)
})

test('Bitset.xor keeps bits that differ', () => {
  const a = new Bitset(8)
  const b = new Bitset(8)
  a.set(1)
  a.set(2)
  b.set(2)
  b.set(3)

  const xorResult = Bitset.xor(a, b)

  assert.equal(xorResult.get(1), true)
  assert.equal(xorResult.get(2), false)
  assert.equal(xorResult.get(3), true)
})

test('Bitset.not flips set bit to unset', () => {
  const source = new Bitset(8)
  source.set(1)

  const inverted = Bitset.not(source)

  assert.equal(inverted.get(1), false)
})

test('Bitset.not flips unset bit to set', () => {
  const source = new Bitset(8)

  const inverted = Bitset.not(source)

  assert.equal(inverted.get(1), true)
})

test('Bitset and with unequal sizes is currently non-throwing', () => {
  assert.doesNotThrow(() => Bitset.and(new Bitset(8), new Bitset(4)))
})

test('Bitset out-of-range get is currently non-throwing', () => {
  const bitset = new Bitset(2)

  assert.doesNotThrow(() => bitset.get(2))
})

test('Bitset out-of-range set is currently non-throwing', () => {
  const bitset = new Bitset(2)

  assert.doesNotThrow(() => bitset.set(2))
})

test('Bitset out-of-range reset is currently non-throwing', () => {
  const bitset = new Bitset(2)

  assert.doesNotThrow(() => bitset.reset(2))
})
