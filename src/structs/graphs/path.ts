export type GraphPathNodeSerial = {
  parent: number | undefined
  gCost: number
  hCost: number
}

export class GraphPathNode<NodeId extends number> {
  gCost: number
  hCost: number
  parent: NodeId | undefined

  constructor(parent: NodeId | undefined = undefined, gCost = 0, hCost = 0) {
    this.parent = parent
    this.gCost = gCost
    this.hCost = hCost
  }

  serialize() {
    return GraphPathNode.serialize(this)
  }

  fCost(): number {
    return this.gCost + this.hCost
  }

  /**
   */
  static serialize<T extends number>(value: GraphPathNode<T>) {
    return {
      parent: value.parent,
      gCost: value.gCost,
      hCost: value.hCost
    }
  }

  static validSerial(value: unknown): value is GraphPathNodeSerial {
    return !!value
      && typeof value === 'object'
      && (typeof (value as GraphPathNodeSerial).parent === 'number'
        || typeof (value as GraphPathNodeSerial).parent === 'undefined')
      && typeof (value as GraphPathNodeSerial).gCost === 'number'
      && typeof (value as GraphPathNodeSerial).hCost === 'number'
  }

  /**
   * @param {GraphPathNodeSerial} value
   * @param {GraphPathNode<NodeId>} [out]
   */
  static deserialize<T extends number>(value: GraphPathNodeSerial, out = new GraphPathNode<T>()) {
    out.parent = value.parent as T | undefined
    out.gCost = value.gCost
    out.hCost = value.hCost

    return out
  }
}

export class GraphPath<NodeId extends number> {
  private inner = new Map<NodeId, GraphPathNode<NodeId>>()

  set(id: NodeId, value: GraphPathNode<NodeId>): GraphPathNode<NodeId> {
    this.inner.set(id, value)
    return value
  }

  get(id: NodeId): GraphPathNode<NodeId> | undefined {
    return this.inner.get(id)
  }

  getOrSet(key: NodeId): GraphPathNode<NodeId> {
    const node = this.get(key)

    if (node) {
      return node
    }

    return this.set(key, new GraphPathNode<NodeId>())
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

  forEach(callback: (id: NodeId, node: GraphPathNode<NodeId>) => void): void {
    for (const [id, node] of this.inner.entries()) {
      callback(id, node)
    }
  }
}
