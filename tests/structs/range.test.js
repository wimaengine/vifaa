import test from 'node:test'
import assert from 'node:assert/strict'

import { Range } from '../../dist/index.module.js'

test('Range serialize returns plain data', () => {
  const range = new Range(2, 9)

  assert.deepEqual(range.serialize(), {
    start: 2,
    end: 9
  })
})

test('Range deserialize restores data into an existing range', () => {
  const out = new Range()

  const range = Range.deserialize({
    start: 5,
    end: 12
  }, out)

  assert.equal(range, out)
  assert.equal(range.start, 5)
  assert.equal(range.end, 12)
})

test('Range validateSerial accepts the expected shape', () => {
  assert.equal(Range.validateSerial({
    start: 1,
    end: 4
  }), true)
})

test('Range validateSerial rejects malformed data', () => {
  assert.equal(Range.validateSerial({
    start: '1',
    end: 4
  }), false)
})
