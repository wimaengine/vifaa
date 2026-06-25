import { packInto64Int, unpackFrom64Int, unpackLowBitsFrom64Int } from "../../pack";

export class GenerationalIndexAllocator<T extends number = number> {
  private nextid = 0
  private recycled: T[] = []

  recycle(index: T): void {
    this.recycled.push(index)
  }

  reserve(): T {
    const recycled = this.recycled.pop()
    
    if (recycled !== undefined) {
      const [index, generation] = unpackFrom64Int(recycled)

      return packInto64Int(index, generation + 1) as T
    }

    const index = this.nextid
    this.nextid += 1

    return packInto64Int(index, 1) as T
  }

  mapIndex(index: T): number {
    return unpackLowBitsFrom64Int(index)
  }

  count(): number {
    return this.nextid - 1
  }
}
