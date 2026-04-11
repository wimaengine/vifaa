import { IndexAllocator } from './indexallocator'

export class DenseList<T, I extends number = number> {
  private list: T[] = []
  private allocator: IndexAllocator<I> = new IndexAllocator<I>()

  push(object: T): I {
    const index = this.allocator.reserve()
    this.list[index] = object
    return index
  }

  recycle(index: I): void {
    this.allocator.recycle(index)
  }

  get(index: I): T | undefined {
    return this.list[index]
  }

  set(index: I, object: T): void {
    if (index > this.allocator.count()) {
      throw new Error('The index provided has never been allocated')
    }
    this.list[index] = object
  }

  reserve(): I {
    return this.allocator.reserve()
  }

  values(): ReadonlyArray<T> {
    return this.list
  }
}
