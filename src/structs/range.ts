export class Range {
  start: number
  end:number
  constructor(start = 0, end = 1) {
    this.start = start
    this.end = end
  }

  valid() {
    return this.start <= this.end
  }

  lerp(t: number) {
    return this.start + t * (this.end - this.start)
  }
}
