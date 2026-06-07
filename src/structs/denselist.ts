import { IndexAllocator } from './indexAllocator'

export class DenseList<T, Index extends number = number, Allocator extends IndexAllocator<Index> = IndexAllocator<Index>> {
  private list: T[] = []
  private allocator: Allocator

  constructor(allocator: Allocator){
    this.allocator = allocator
  }

  push(object: T): Index {
    const index = this.allocator.reserve()
    this.list[index] = object
    return index
  }

  recycle(index: Index): void {
    this.allocator.recycle(index)
  }

  get(index: Index): T | undefined {
    return this.list[index]
  }

  set(index: Index, object: T): void {
    if (index > this.allocator.count()) {
      throw new Error('The index provided has never been allocated')
    }
    this.list[index] = object
  }

  reserve(): Index {
    return this.allocator.reserve()
  }

  values(): ReadonlyArray<T> {
    return this.list
  }
}
