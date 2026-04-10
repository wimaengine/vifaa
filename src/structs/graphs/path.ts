import type { NodeId } from './graph'

export class GraphPathNode {
  gCost: number
  hCost: number
  parent: NodeId | undefined

  constructor(parent: NodeId | undefined = undefined, gCost = 0, hCost = 0) {
    this.parent = parent
    this.gCost = gCost
    this.hCost = hCost
  }

  fCost(): number {
    return this.gCost + this.hCost
  }
}

export class GraphPath {
  private inner = new Map<NodeId, GraphPathNode>()

  set(id: NodeId, value: GraphPathNode): GraphPathNode {
    this.inner.set(id, value)
    return value
  }

  get(id: NodeId): GraphPathNode | undefined {
    return this.inner.get(id)
  }

  getOrSet(key: NodeId): GraphPathNode {
    const node = this.get(key)

    if (node) {
      return node
    }

    return this.set(key, new GraphPathNode())
  }

  delete(id: NodeId): void {
    this.inner.delete(id)
  }

  has(id: NodeId): boolean {
    return this.inner.has(id)
  }

  path(id: NodeId): NodeId[] {
    let currentid = id
    let current = this.get(currentid)
    const path: NodeId[] = []

    while (current) {
      path.push(currentid)

      if (current.parent !== undefined) {
        currentid = current.parent
        current = this.get(currentid)
      } else {
        break
      }
    }

    return path.reverse()
  }

  forEach(callback: (id: NodeId, node: GraphPathNode) => void): void {
    for (const [id, node] of this.inner.entries()) {
      callback(id, node)
    }
  }
}
