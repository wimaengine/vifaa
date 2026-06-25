export class IndexAllocator<T extends number = number> {
  private nextid = 0
  private recycled: T[] = []

  recycle(index: T): void {
    this.recycled.push(index)
  }

  reserve(): T {
    const recycled = this.recycled.pop()

    if (recycled !== undefined) {
      return recycled
    }

    const index = this.nextid
    this.nextid += 1

    return index as T
  }

  mapIndex(index: T){
    return index as number
  }

  count(): number {
    return this.nextid - 1
  }
}
