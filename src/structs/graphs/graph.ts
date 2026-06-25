import type { EdgeAccessor, NodeEdgeIterable, NeighbourIterable, NodeAccessor, EdgeIterable } from '../../core'
import type { EdgeId, NodeId } from '../../core/identifiers'
import type { GraphEdgeSerial, GraphNodeSerial, GraphSerial } from '../../core/serial'
import { validateGraphSerial } from '../../core/serial'
import { Edge, Node } from './primitives'

export { Edge, Node } from './primitives'

function sortedIndexKeys(value: object): number[] {
  return Object.keys(value)
    .map((key) => Number(key))
    .sort((left, right) => left - right)
}

export class Graph<T = unknown, U = unknown> implements
  NodeAccessor<Node<T>, NodeId>,
  EdgeAccessor<Edge<U>, EdgeId>,
  EdgeIterable<EdgeId>,
  NeighbourIterable<NodeId>,
  NodeEdgeIterable<NodeId, EdgeId> {
  private nodes: Node<T>[] = []
  private edges: Edge<U>[] = []
  readonly directed: boolean

  constructor(directed: boolean) {
    this.directed = directed
  }

  serialize() {
    return Graph.serialize(this)
  }

  addNode(weight: T): NodeId {
    const node = new Node(weight)
    const id = this.nodes.length as NodeId
    this.nodes.push(node)
    return id
  }

  addEdge(from: NodeId, to: NodeId, weight: U): EdgeId {
    const existingId = this.findEdgeId(from, to)
    if (existingId !== undefined) {
      return existingId
    }

    return this.addEdgeUnchecked(from, to, weight)
  }

  addEdgeUnchecked(from: NodeId, to: NodeId, weight: U): EdgeId {
    const id = this.edges.length as EdgeId
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

  forEachNode(callback: (nodeId: NodeId) => void): void {
    for (let id = 0; id < this.nodes.length; id += 1) {
      callback(id as NodeId)
    }
  }

  hasEdge(from: NodeId, to: NodeId): boolean {
    return this.findEdgeId(from, to) !== undefined
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

  forEachEdge(callback: (edgeId: EdgeId) => void): void {
    for (let id = 0; id < this.edges.length; id += 1) {
      if (this.edges[id] !== undefined) {
        callback(id as EdgeId)
      }
    }
  }

  forEachNodeEdge(id: NodeId, callback: (edgeId: EdgeId) => void): void {
    const node = this.getNode(id)
    if (!node) {
      return
    }

    if (this.directed) {
      for (let edgeId = node.next[0]; edgeId !== undefined; edgeId = this.getEdge(edgeId)?.next[0]) {
        if (!this.getEdge(edgeId)) {
          break
        }

        callback(edgeId)
      }
      return
    }

    for (let edgeId = node.next[0]; edgeId !== undefined; edgeId = this.getEdge(edgeId)?.next[0]) {
      const edge = this.getEdge(edgeId)
      if (!edge) {
        break
      }

      if (edge.from === id) {
        callback(edgeId)
      }
    }

    for (let edgeId = node.next[1]; edgeId !== undefined; edgeId = this.getEdge(edgeId)?.next[1]) {
      const edge = this.getEdge(edgeId)
      if (!edge) {
        break
      }

      if (edge.to === id && edge.from !== id) {
        callback(edgeId)
      }
    }
  }

  forEachNeighbour(id: NodeId, callback: (nodeId: NodeId) => void): void {
    this.forEachNodeEdge(id, (edgeId) => {
      const edge = this.getEdge(edgeId)
      if (!edge) {
        return
      }

      if (this.directed || edge.from === id) {
        callback(edge.to)
      } else {
        callback(edge.from)
      }
    })
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
      this.#replaceEdgeId(lastId as EdgeId, id)
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

  findEdgeId(from: NodeId, to: NodeId): EdgeId | undefined {
    const node = this.nodes[from]
    if (!node) {
      return undefined
    }

    const directions: Array<0 | 1> = this.directed ? [0] : [0, 1]

    for (const dir of directions) {
      for (let edgeId = node.next[dir]; edgeId !== undefined; edgeId = this.edges[edgeId]?.next[dir]) {
        const edge = this.edges[edgeId]
        if (!edge) {
          break
        }

        if (this.#edgeMatches(edge, from, to)) {
          return edgeId
        }
      }
    }

    return undefined
  }

  #edgeMatches(edge: Edge<U>, from: NodeId, to: NodeId): boolean {
    if (this.directed) {
      return edge.from === from && edge.to === to
    }

    return (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)
  }

  static serialize<T, U>(value: Graph<T, U>) {
    const nodes: GraphSerial<T, U>['nodes'] = {}
    const edges: GraphSerial<T, U>['edges'] = {}

    for (let nodeId = 0; nodeId < value.nodes.length; nodeId += 1) {
      const node = value.nodes[nodeId]
      if (!node) {
        continue
      }

      const edgeIds: EdgeId[] = []
      value.forEachNodeEdge(nodeId as NodeId, (edgeId) => {
        const edge = value.getEdge(edgeId)
        if (edge && edge.from === nodeId) {
          edgeIds.push(edgeId)
        }
      })

      nodes[nodeId as NodeId] = {
        edges: edgeIds,
        ...(node.weight !== undefined ? { weight: node.weight } : {})
      }
    }

    for (let edgeId = 0; edgeId < value.edges.length; edgeId += 1) {
      const edge = value.edges[edgeId]
      if (!edge) {
        continue
      }

      edges[edgeId as EdgeId] = {
        from: edge.from,
        to: edge.to,
        ...(edge.weight !== undefined ? { weight: edge.weight } : {})
      }
    }

    return {
      directed: value.directed,
      nodes,
      edges
    }
  }

  static validSerial<T, U>(value: unknown): value is GraphSerial<T, U> {
    return validateGraphSerial<T, U>(value)
  }

  static deserialize<T, U>(value: GraphSerial<T, U>, out = new Graph<T, U>(value.directed)) {
    const nodeRecords = value.nodes as Record<number, GraphNodeSerial<T> | undefined>
    const edgeRecords = value.edges as Record<number, GraphEdgeSerial<U> | undefined>
    const nodeIds = sortedIndexKeys(value.nodes)
    const edgeIds = sortedIndexKeys(value.edges)
    const nodeIdMap = new Map<NodeId, NodeId>()
    const edgeIdMap = new Map<EdgeId, EdgeId>()
    const outgoing = new Map<NodeId, EdgeId[]>()
    const incoming = new Map<NodeId, EdgeId[]>()

    out.nodes = []
    out.edges = []

    for (const nodeId of nodeIds) {
      const serialNode = nodeRecords[nodeId] as GraphNodeSerial<T>
      const denseNodeId = out.nodes.length as NodeId
      out.nodes.push(new Node(serialNode.weight as T))
      nodeIdMap.set(nodeId as NodeId, denseNodeId)
      outgoing.set(denseNodeId, [])
      incoming.set(denseNodeId, [])
    }

    for (const edgeId of edgeIds) {
      const serialEdge = edgeRecords[edgeId] as GraphEdgeSerial<U>
      const from = nodeIdMap.get(serialEdge.from)
      const to = nodeIdMap.get(serialEdge.to)

      const denseEdgeId = out.edges.length as EdgeId
      out.edges.push(new Edge(from as NodeId, to as NodeId, serialEdge.weight as U))
      edgeIdMap.set(edgeId as EdgeId, denseEdgeId)
    }

    for (const [nodeIdText, serialNodeRaw] of Object.entries(value.nodes)) {
      const serialNode = serialNodeRaw as GraphNodeSerial<T>
      const denseNodeId = nodeIdMap.get(Number(nodeIdText) as NodeId)
      const edgesForNode = outgoing.get(denseNodeId as NodeId) as EdgeId[]

      for (const serialEdgeId of serialNode.edges) {
        const denseEdgeId = edgeIdMap.get(serialEdgeId)
        edgesForNode.push(denseEdgeId as EdgeId)
      }
    }

    for (const [edgeIdText, serialEdgeRaw] of Object.entries(value.edges)) {
      const serialEdge = serialEdgeRaw as GraphEdgeSerial<U>
      const denseEdgeId = edgeIdMap.get(Number(edgeIdText) as EdgeId)
      const edge = out.edges[denseEdgeId as EdgeId]
      const from = nodeIdMap.get(serialEdge.from)
      const to = nodeIdMap.get(serialEdge.to)

      edge.from = from as NodeId
      edge.to = to as NodeId

      const fromIncoming = incoming.get(from as NodeId)
      const toIncoming = incoming.get(to as NodeId)

      fromIncoming?.push(denseEdgeId as EdgeId)
      toIncoming?.push(denseEdgeId as EdgeId)
    }

    for (let nodeId = 0; nodeId < out.nodes.length; nodeId += 1) {
      const node = out.nodes[nodeId] as Node<T>

      const outgoingEdges = outgoing.get(nodeId as NodeId) ?? []
      for (let index = outgoingEdges.length - 1; index >= 0; index -= 1) {
        const edgeId = outgoingEdges[index]
        const edge = out.edges[edgeId] as Edge<U>

        edge.next[0] = node.next[0]
        node.next[0] = edgeId
      }

      const incomingEdges = incoming.get(nodeId as NodeId) ?? []
      for (let index = incomingEdges.length - 1; index >= 0; index -= 1) {
        const edgeId = incomingEdges[index]
        const edge = out.edges[edgeId] as Edge<U>

        edge.next[1] = node.next[1]
        node.next[1] = edgeId
      }
    }

    return out
  }
}
