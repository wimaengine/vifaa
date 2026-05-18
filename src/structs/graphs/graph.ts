export type EdgeId = number
export type NodeId = number

export class Node<T> {
  next: [EdgeId | undefined, EdgeId | undefined] = [undefined, undefined]
  weight: T

  constructor(weight: T) {
    this.weight = weight
  }
}

export class Edge<T> {
  from: NodeId
  to: NodeId
  next: [EdgeId | undefined, EdgeId | undefined] = [undefined, undefined]
  weight: T

  constructor(from: NodeId, to: NodeId, weight: T) {
    this.from = from
    this.to = to
    this.weight = weight
  }
}

export class Graph<T = unknown, U = unknown> {
  private nodes: Node<T>[] = []
  private edges: Edge<U>[] = []
  readonly directed: boolean

  constructor(directed: boolean) {
    this.directed = directed
  }

  addNode(weight: T): NodeId {
    const node = new Node(weight)
    const id = this.nodes.length
    this.nodes.push(node)
    return id
  }

  addEdge(from: NodeId, to: NodeId, weight: U): EdgeId {
    const id = this.edges.length
    const edge = new Edge(from, to, weight)

    this.edges.push(edge)
    const nodeA = this.nodes[from]
    const nodeB = this.nodes[to]

    edge.next[0] = nodeA.next[0]
    edge.next[1] = nodeB.next[1]
    nodeA.next[0] = id
    nodeB.next[1] = id

    return id
  }

  getNode(id: NodeId): Node<T> | undefined {
    return this.nodes[id]
  }

  getEdge(id: EdgeId): Edge<U> | undefined {
    return this.edges[id]
  }

  hasEdge(from: NodeId, to: NodeId): boolean {
    for (let edgeId = this.nodes[from]?.next[0]; edgeId !== undefined; edgeId = this.edges[edgeId]?.next[0]) {
      const edge = this.edges[edgeId]
      if (!edge) {
        break
      }

      if (edge.to === to) {
        return true
      }
    }

    return false
  }

  getNodeWeight(id: NodeId): T | undefined {
    const node = this.getNode(id)
    if (!node) {
      return undefined
    }
    return node.weight
  }

  getEdgeWeight(id: EdgeId): U | undefined {
    const edge = this.getEdge(id)
    if (!edge) {
      return undefined
    }
    return edge.weight
  }

  getNeighbours(id: NodeId): GraphNeighbourIterator<T, U> {
    return new GraphNeighbourIterator(this, id)
  }

  getNodeEdges(id: NodeId): GraphNodeEdgesIterator<T, U> {
    return new GraphNodeEdgesIterator(this, id)
  }

  getEdges(): Edge<U>[] {
    return this.edges
  }

  getNodes(): Node<T>[] {
    return this.nodes
  }

  setNodeWeight(id: NodeId, weight: T): void {
    const node = this.getNode(id)
    if (node) {
      node.weight = weight
    }
  }

  setEdgeWeight(id: EdgeId, weight: U): void {
    const edge = this.getEdge(id)
    if (edge) {
      edge.weight = weight
    }
  }

  removeNode(id: NodeId): boolean {
    const lastId = this.nodes.length - 1
    const node = this.nodes[id]

    if (!node) {
      return false
    }

    let edgeId = node.next[0]
    while (edgeId !== undefined) {
      const edge = this.edges[edgeId]
      if (!edge) {
        break
      }

      const next = edge.next[0]
      this.removeEdge(edgeId)
      edgeId = next
    }

    edgeId = node.next[1]
    while (edgeId !== undefined) {
      const edge = this.edges[edgeId]
      if (!edge) {
        break
      }

      const next = edge.next[1]
      this.removeEdge(edgeId)
      edgeId = next
    }

    if (id !== lastId) {
      const lastNode = this.nodes[lastId]
      this.nodes[id] = lastNode
      for (const edge of this.edges) {
        if (edge.from === lastId) {
          edge.from = id
        }
        if (edge.to === lastId) {
          edge.to = id
        }
      }
    }

    this.nodes.pop()

    return true
  }

  removeEdge(id: EdgeId): boolean {
    const lastId = this.edges.length - 1
    const edge = this.edges[id]

    if (!edge) {
      return false
    }

    this.#unlinkEdgeFromNode(edge.from, id, 0)
    this.#unlinkEdgeFromNode(edge.to, id, 1)

    if (id !== lastId) {
      const lastEdge = this.edges[lastId]
      this.edges[id] = lastEdge
      this.#replaceEdgeId(lastId, id)
    }

    this.edges.pop()

    return true
  }

  #unlinkEdgeFromNode(nodeId: NodeId, edgeId: EdgeId, dir: 0 | 1): void {
    const node = this.nodes[nodeId]

    let currentId = node.next[dir]
    let prevId: EdgeId | undefined

    while (currentId !== undefined) {
      if (currentId === edgeId) {
        const currentEdge = this.edges[currentId]
        if (!currentEdge) {
          return
        }

        if (prevId === undefined) {
          node.next[dir] = currentEdge.next[dir]
        } else {
          this.edges[prevId].next[dir] = currentEdge.next[dir]
        }

        return
      }

      prevId = currentId
      currentId = this.edges[currentId].next[dir]
    }
  }

  #replaceEdgeId(oldId: EdgeId, newId: EdgeId): void {
    for (const node of this.nodes) {
      if (node.next[0] === oldId) {
        node.next[0] = newId
      }
      if (node.next[1] === oldId) {
        node.next[1] = newId
      }
    }

    for (const edge of this.edges) {
      if (edge.next[0] === oldId) {
        edge.next[0] = newId
      }
      if (edge.next[1] === oldId) {
        edge.next[1] = newId
      }
    }
  }

  getNodeCount(): number {
    return this.nodes.length
  }

  getEdgeCount(): number {
    return this.edges.length
  }
}

export class GraphNodeEdgesIterator<T, U> {
  private graph: Graph<T, U>
  private nodeid: NodeId

  constructor(graph: Graph<T, U>, nodeid: NodeId) {
    this.graph = graph
    this.nodeid = nodeid
  }

  *[Symbol.iterator](): IterableIterator<Edge<U>> {
    let edgeId = this.graph.getNode(this.nodeid)?.next[0]
    while (edgeId !== undefined) {
      const edge = this.graph.getEdge(edgeId)

      if (!edge) {
        break
      }
      yield edge
      edgeId = edge.next[0]
    }
  }
}

export class GraphNeighbourIterator<T, U> {
  private edgeIter: GraphNodeEdgesIterator<T, U>

  constructor(graph: Graph<T, U>, nodeid: NodeId) {
    this.edgeIter = new GraphNodeEdgesIterator(graph, nodeid)
  }

  *[Symbol.iterator](): IterableIterator<NodeId> {
    for (const edge of this.edgeIter) {
      yield edge.to
    }
  }
}
