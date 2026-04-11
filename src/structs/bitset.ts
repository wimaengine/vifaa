import { assert } from '../utils'

const indexerror = 'Tried to index into `Bitset()` futher than its size.'
const oplengtherror = '`Bitset`s should be of equal size to apply the operation.'

const WORD_LENGTH = 32
const WORD_LOG = Math.log2(WORD_LENGTH)

export class Bitset {
  private data: Uint32Array
  private size: number

  constructor(size = 0) {
    this.data = new Uint32Array(Math.ceil(size / WORD_LENGTH))
    this.size = size
  }

  get(index: number): boolean {
    return Bitset.get(this, index)
  }

  length(): number {
    return this.size
  }

  set(index: number): void {
    Bitset.set(this, index)
  }

  reset(index: number): void {
    Bitset.reset(this, index)
  }

  and(other: Bitset): this {
    Bitset.and(this, other, this)
    return this
  }

  or(other: Bitset): this {
    Bitset.or(this, other, this)
    return this
  }

  xor(other: Bitset): this {
    Bitset.xor(this, other, this)
    return this
  }

  not(): this {
    Bitset.not(this, this)
    return this
  }

  clear(): void {
    Bitset.clear(this)
  }

  resize(size: number): void {
    Bitset.resize(this, size)
  }

  static get(bitset: Bitset, index: number): boolean {
    assert(index < bitset.size, indexerror)

    const indexer = index >>> WORD_LOG
    const mask = 1 << index

    return (bitset.data[indexer] & mask) !== 0
  }

  static set(bitset: Bitset, index: number): void {
    assert(index < bitset.size, indexerror)

    const indexer = index >>> WORD_LOG
    const mask = 1 << index

    bitset.data[indexer] |= mask
  }

  static reset(bitset: Bitset, index: number): void {
    assert(index < bitset.size, indexerror)

    const indexer = index >>> WORD_LOG
    const mask = 1 << index

    bitset.data[indexer] &= ~mask
  }

  static clear(bitset: Bitset): void {
    for (let i = 0; i < bitset.data.length; i++) {
      bitset.data[i] = 0
    }
  }

  static resize(bitset: Bitset, size: number): void {
    const length = Math.ceil(size / WORD_LENGTH)

    if (length < bitset.data.length) {
      return
    }

    const data = new Uint32Array(length)
    data.set(bitset.data)

    bitset.data = data
    bitset.size = size
  }

  static and(bitset1: Bitset, bitset2: Bitset, out = new Bitset(bitset1.size)): Bitset {
    assert(bitset1.size === bitset2.size, `${oplengtherror}\`Bitset.and()\``)

    for (let i = 0; i < bitset1.size; i++) {
      out.data[i] = bitset1.data[i] & bitset2.data[i]
    }

    return out
  }

  static or(bitset1: Bitset, bitset2: Bitset, out = new Bitset(bitset1.size)): Bitset {
    assert(bitset1.size === bitset2.size, `${oplengtherror}\`Bitset.or()\``)

    for (let i = 0; i < bitset1.size; i++) {
      out.data[i] = bitset1.data[i] | bitset2.data[i]
    }

    return out
  }

  static xor(bitset1: Bitset, bitset2: Bitset, out = new Bitset(bitset1.size)): Bitset {
    assert(bitset1.size === bitset2.size, `${oplengtherror}\`Bitset.xor()\``)

    for (let i = 0; i < bitset1.size; i++) {
      out.data[i] = bitset1.data[i] ^ bitset2.data[i]
    }

    return out
  }

  static not(bitset: Bitset, out = new Bitset(bitset.size)): Bitset {
    for (let i = 0; i < bitset.size; i++) {
      out.data[i] = ~bitset.data[i]
    }

    return out
  }
}
