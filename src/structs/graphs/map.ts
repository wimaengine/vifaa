import type { EdgeAccessor, EdgeIterable, NeighbourIterable, NodeAccessor, NodeEdgeIterable } from '../../core'
import type { EdgeId, NodeId } from '../../core/identifiers'
import type { GraphSerial } from '../../core/serial'
import { validateGraphSerial } from '../../core/serial'
import { Edge, Node } from './primitives'

export class GraphMap<T = unknown, U = unknown> implements
  NodeAccessor<Node<T>, NodeId>,
  EdgeAccessor<Edge<U>, EdgeId>,
  EdgeIterable<EdgeId>,
  NeighbourIterable<NodeId>,
  NodeEdgeIterable<NodeId, EdgeId> {
  protected nodes = new Map<NodeId, Node<T>>()
  protected edges = new Map<EdgeId, Edge<U>>()
  private recycledNodeIds: NodeId[] = []
  private recycledEdgeIds: EdgeId[] = []
  private nextNodeId = 0
  private nextEdgeId = 0
  private nodeCount = 0
  private edgeCount = 0
  readonly directed: boolean

  constructor(directed: boolean) {
    this.directed = directed
  }

  serialize(): GraphSerial<T, U> {
    return GraphMap.serialize(this)
  }

  addNode(weight: T): NodeId {
    const node = new Node(weight)
    const id = this.recycledNodeIds.pop() ?? (this.nextNodeId as NodeId)

    if (id === this.nextNodeId) {
      this.nextNodeId += 1
    }

    this.nodes.set(id, node)
    this.nodeCount += 1

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
    const nodeA = this.getNode(from)
    const nodeB = this.getNode(to)

    if (!nodeA || !nodeB) {
      throw new Error('Cannot add an edge with a missing endpoint')
    }

    const id = this.recycledEdgeIds.pop() ?? (this.nextEdgeId as EdgeId)
    if (id === this.nextEdgeId) {
      this.nextEdgeId += 1
    }

    const edge = new Edge(from, to, weight)

    this.edges.set(id, edge)
    edge.next[0] = nodeA.next[0]
    edge.next[1] = nodeB.next[1]
    nodeA.next[0] = id
    nodeB.next[1] = id
    this.edgeCount += 1

    return id
  }

  getNode(id: NodeId): Node<T> | undefined {
    return this.nodes.get(id)
  }

  getEdge(id: EdgeId): Edge<U> | undefined {
    return this.edges.get(id)
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

  forEachNode(callback: (nodeId: NodeId) => void): void {
    for (const id of this.nodes.keys()) {
      callback(id)
    }
  }

  forEachEdge(callback: (edgeId: EdgeId) => void): void {
    for (const id of this.edges.keys()) {
      callback(id)
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

  getNodes(): Array<Node<T> | undefined> {
    const nodes: Array<Node<T> | undefined> = []
    for (const [id, node] of this.nodes.entries()) {
      nodes[id as number] = node
    }
    return nodes
  }

  getEdges(): Array<Edge<U> | undefined> {
    const edges: Array<Edge<U> | undefined> = []
    for (const [id, edge] of this.edges.entries()) {
      edges[id as number] = edge
    }
    return edges
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
    const node = this.getNode(id)
    if (!node) {
      return false
    }

    let edgeId = node.next[0]
    while (edgeId !== undefined) {
      const edge = this.getEdge(edgeId)
      if (!edge) {
        break
      }

      const next = edge.next[0]
      this.removeEdge(edgeId)
      edgeId = next
    }

    edgeId = node.next[1]
    while (edgeId !== undefined) {
      const edge = this.getEdge(edgeId)
      if (!edge) {
        break
      }

      const next = edge.next[1]
      this.removeEdge(edgeId)
      edgeId = next
    }

    this.nodes.delete(id)
    this.recycledNodeIds.push(id)
    this.nodeCount -= 1

    return true
  }

  removeEdge(id: EdgeId): boolean {
    const edge = this.getEdge(id)
    if (!edge) {
      return false
    }

    this.#unlinkEdgeFromNode(edge.from, id, 0)
    this.#unlinkEdgeFromNode(edge.to, id, 1)

    this.edges.delete(id)
    this.recycledEdgeIds.push(id)
    this.edgeCount -= 1

    return true
  }

  getNodeCount(): number {
    return this.nodeCount
  }

  getEdgeCount(): number {
    return this.edgeCount
  }

  findEdgeId(from: NodeId, to: NodeId): EdgeId | undefined {
    const node = this.getNode(from)
    if (!node) {
      return undefined
    }

    const directions: Array<0 | 1> = this.directed ? [0] : [0, 1]

    for (const dir of directions) {
      for (let edgeId = node.next[dir]; edgeId !== undefined; edgeId = this.getEdge(edgeId)?.next[dir]) {
        const edge = this.getEdge(edgeId)
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

  #unlinkEdgeFromNode(nodeId: NodeId, edgeId: EdgeId, dir: 0 | 1): void {
    const node = this.getNode(nodeId)
    if (!node) {
      return
    }

    let currentId = node.next[dir]
    let prevId: EdgeId | undefined

    while (currentId !== undefined) {
      if (currentId === edgeId) {
        const currentEdge = this.getEdge(currentId)
        if (!currentEdge) {
          return
        }

        if (prevId === undefined) {
          node.next[dir] = currentEdge.next[dir]
        } else {
          const previousEdge = this.getEdge(prevId)
          if (previousEdge) {
            previousEdge.next[dir] = currentEdge.next[dir]
          }
        }

        return
      }

      prevId = currentId
      currentId = this.getEdge(currentId)?.next[dir]
    }
  }

  #edgeMatches(edge: Edge<U>, from: NodeId, to: NodeId): boolean {
    if (this.directed) {
      return edge.from === from && edge.to === to
    }

    return (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)
  }

  static serialize<T, U>(value: GraphMap<T, U>) {
    const nodes: GraphSerial<T, U>['nodes'] = {}
    const edges: GraphSerial<T, U>['edges'] = {}

    for (const [id, node] of value.nodes.entries()) {
      const edgeIds: EdgeId[] = []

      value.forEachNodeEdge(id, (edgeId) => {
        const edge = value.getEdge(edgeId)
        if (edge && edge.from === id) {
          edgeIds.push(edgeId)
        }
      })

      nodes[id] = {
        edges: edgeIds,
        ...(node.weight !== undefined ? { weight: node.weight } : {})
      }
    }

    for (const [id, edge] of value.edges.entries()) {
      edges[id] = {
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

  static validateSerial<T, U>(value: unknown): value is GraphSerial<T, U> {
    return validateGraphSerial<T, U>(value)
  }

  static deserialize<T, U>(value: GraphSerial<T, U>, out = new GraphMap<T, U>(value.directed)) {
    const nodeIds = Object.keys(value.nodes)
      .map((key) => Number(key) as NodeId)
      .sort((left, right) => left - right)
    const edgeIds = Object.keys(value.edges)
      .map((key) => Number(key) as EdgeId)
      .sort((left, right) => left - right)

    out.nodes.clear()
    out.edges.clear()
    out.recycledNodeIds = []
    out.recycledEdgeIds = []
    out.nodeCount = 0
    out.edgeCount = 0

    for (const nodeId of nodeIds) {
      const node = value.nodes[nodeId] as NonNullable<GraphSerial<T, U>['nodes'][NodeId]>
      out.nodes.set(nodeId, new Node(node.weight as T))
      out.nodeCount += 1
    }

    for (const edgeId of edgeIds) {
      const edge = value.edges[edgeId] as NonNullable<GraphSerial<T, U>['edges'][EdgeId]>
      out.edges.set(edgeId, new Edge(edge.from, edge.to, edge.weight as U))
      out.edgeCount += 1
    }

    const maxNodeId = nodeIds.length ? nodeIds[nodeIds.length - 1] : -1
    const maxEdgeId = edgeIds.length ? edgeIds[edgeIds.length - 1] : -1

    out.nextNodeId = (maxNodeId + 1) as NodeId
    out.nextEdgeId = (maxEdgeId + 1) as EdgeId

    const recycledNodeIds: NodeId[] = []
    const recycledEdgeIds: EdgeId[] = []

    for (let id = 0; id <= maxNodeId; id += 1) {
      if (!out.nodes.has(id as NodeId)) {
        recycledNodeIds.push(id as NodeId)
      }
    }

    for (let id = 0; id <= maxEdgeId; id += 1) {
      if (!out.edges.has(id as EdgeId)) {
        recycledEdgeIds.push(id as EdgeId)
      }
    }

    out.recycledNodeIds = recycledNodeIds.reverse()
    out.recycledEdgeIds = recycledEdgeIds.reverse()

    const outgoing = new Map<NodeId, EdgeId[]>()
    const incoming = new Map<NodeId, EdgeId[]>()

    for (const nodeId of out.nodes.keys()) {
      outgoing.set(nodeId, [])
      incoming.set(nodeId, [])
    }

    for (const [nodeIdText, nodeRaw] of Object.entries(value.nodes)) {
      const node = nodeRaw as NonNullable<GraphSerial<T, U>['nodes'][NodeId]>
      const nodeId = Number(nodeIdText) as NodeId
      const edgesForNode = outgoing.get(nodeId) as EdgeId[]

      for (const edgeId of node.edges) {
        edgesForNode.push(edgeId)
      }
    }

    for (const [edgeIdText, edgeRaw] of Object.entries(value.edges)) {
      const edge = edgeRaw as NonNullable<GraphSerial<T, U>['edges'][EdgeId]>
      const edgeId = Number(edgeIdText) as EdgeId
      incoming.get(edge.from)?.push(edgeId)
      incoming.get(edge.to)?.push(edgeId)
    }

    for (const [nodeId, node] of out.nodes.entries()) {
      const outgoingEdges = outgoing.get(nodeId) ?? []
      for (let index = outgoingEdges.length - 1; index >= 0; index -= 1) {
        const edgeId = outgoingEdges[index]
        const edge = out.edges.get(edgeId) as Edge<U>

        edge.next[0] = node.next[0]
        node.next[0] = edgeId
      }

      const incomingEdges = incoming.get(nodeId) ?? []
      for (let index = incomingEdges.length - 1; index >= 0; index -= 1) {
        const edgeId = incomingEdges[index]
        const edge = out.edges.get(edgeId) as Edge<U>

        edge.next[1] = node.next[1]
        node.next[1] = edgeId
      }
    }

    return out
  }
}
