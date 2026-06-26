export type RangeSerial = {
  start: number
  end: number
}

export class Range {
  start: number
  end: number
  constructor(start = 0, end = 1) {
    this.start = start
    this.end = end
  }

  serialize() {
    return Range.serialize(this)
  }

  valid() {
    return this.start <= this.end
  }

  lerp(t: number) {
    return this.start + t * (this.end - this.start)
  }

  /**
   * @param {unknown} value
   */
  static serialize(value: Range) {
    return {
      start: value.start,
      end: value.end
    }
  }

  static validateSerial(value: unknown): value is RangeSerial {
    return !!value
      && typeof value === 'object'
      && typeof (value as RangeSerial).start === 'number'
      && typeof (value as RangeSerial).end === 'number'
  }

  /**
   * @param {RangeSerial} value
   * @param {Range} [out]
   */
  static deserialize(value: RangeSerial, out = new Range()) {
    out.start = value.start
    out.end = value.end

    return out
  }
}
