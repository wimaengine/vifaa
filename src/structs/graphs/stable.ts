import type { EdgeAccessor, EdgeIterable, NodeEdgeIterable, NeighbourIterable, NodeAccessor } from '../../core'
import type { EdgeId, NodeId } from '../../core/identifiers'
import type { GraphSerial } from '../../core/serial'
import { validateGraphSerial } from '../../core/serial'
import { IndexAllocator } from '../indexAllocator'
import { Edge, Node } from './primitives'

function hasOwnProperty<T extends object>(value: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

export class StableGraph<T = unknown, U = unknown> implements
  NodeAccessor<Node<T>, NodeId>,
  EdgeAccessor<Edge<U>, EdgeId>,
  EdgeIterable<EdgeId>,
  NeighbourIterable<NodeId>,
  NodeEdgeIterable<NodeId, EdgeId> {
  protected nodes: Array<Node<T> | undefined> = []
  protected edges: Array<Edge<U> | undefined> = []
  private nodeIdAllocator = new IndexAllocator<NodeId>()
  private edgeIdAllocator = new IndexAllocator<EdgeId>()
  private nodeCount = 0
  private edgeCount = 0
  readonly directed: boolean

  constructor(directed: boolean) {
    this.directed = directed
  }

  serialize(): GraphSerial<T, U> {
    return StableGraph.serialize(this)
  }

  addNode(weight: T): NodeId {
    const node = new Node(weight)
    const id = this.nodeIdAllocator.reserve()
    const index = this.nodeIdAllocator.mapIndex(id)

    this.nodes[index] = node
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

    const id = this.edgeIdAllocator.reserve()
    const index = this.edgeIdAllocator.mapIndex(id)
    const edge = new Edge(from, to, weight)

    this.edges[index] = edge
    edge.next[0] = nodeA.next[0]
    edge.next[1] = nodeB.next[1]
    nodeA.next[0] = id
    nodeB.next[1] = id
    this.edgeCount += 1

    return id
  }

  getNode(id: NodeId): Node<T> | undefined {
    return this.nodes[this.nodeIdAllocator.mapIndex(id)]
  }

  getEdge(id: EdgeId): Edge<U> | undefined {
    return this.edges[this.edgeIdAllocator.mapIndex(id)]
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
    for (let index = 0; index < this.nodes.length; index += 1) {
      if (this.nodes[index] !== undefined) {
        callback(index as NodeId)
      }
    }
  }

  forEachEdge(callback: (edgeId: EdgeId) => void): void {
    for (let index = 0; index < this.edges.length; index += 1) {
      if (this.edges[index] !== undefined) {
        callback(index as EdgeId)
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
    const index = this.nodeIdAllocator.mapIndex(id)
    const node = this.getNode(id)
    if (!node) {
      return false
    }

    let edgeId = node.next[0]
    while (edgeId !== undefined) {
      const edge = this.edges[this.edgeIdAllocator.mapIndex(edgeId)]
      if (!edge) {
        break
      }

      const next = edge.next[0]
      this.removeEdge(edgeId)
      edgeId = next
    }

    edgeId = node.next[1]
    while (edgeId !== undefined) {
      const edge = this.edges[this.edgeIdAllocator.mapIndex(edgeId)]
      if (!edge) {
        break
      }

      const next = edge.next[1]
      this.removeEdge(edgeId)
      edgeId = next
    }

    this.nodes[index] = undefined
    this.nodeIdAllocator.recycle(id)
    this.nodeCount -= 1

    return true
  }

  removeEdge(id: EdgeId): boolean {
    const index = this.edgeIdAllocator.mapIndex(id)
    const edge = this.getEdge(id)
    if (!edge) {
      return false
    }

    this.#unlinkEdgeFromNode(edge.from, id, 0)
    this.#unlinkEdgeFromNode(edge.to, id, 1)

    this.edges[index] = undefined
    this.edgeIdAllocator.recycle(id)
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
      for (let edgeId = node.next[dir]; edgeId !== undefined; edgeId = this.edges[this.edgeIdAllocator.mapIndex(edgeId)]?.next[dir]) {
        const edge = this.edges[this.edgeIdAllocator.mapIndex(edgeId)]
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
        const currentEdge = this.edges[this.edgeIdAllocator.mapIndex(currentId)]
        if (!currentEdge) {
          return
        }

        if (prevId === undefined) {
          node.next[dir] = currentEdge.next[dir]
        } else {
          const previousEdge = this.edges[this.edgeIdAllocator.mapIndex(prevId)]
          if (previousEdge) {
            previousEdge.next[dir] = currentEdge.next[dir]
          }
        }

        return
      }

      prevId = currentId
      currentId = this.edges[this.edgeIdAllocator.mapIndex(currentId)]?.next[dir]
    }
  }

  #edgeMatches(edge: Edge<U>, from: NodeId, to: NodeId): boolean {
    if (this.directed) {
      return edge.from === from && edge.to === to
    }

    return (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)
  }

  static serialize<T, U>(value: StableGraph<T, U>) {
    const nodes: GraphSerial<T, U>['nodes'] = {}
    const edges: GraphSerial<T, U>['edges'] = {}

    value.forEachNode((nodeId) => {
      const node = value.getNode(nodeId)
      if (!node) {
        return
      }

      const edgeIds: EdgeId[] = []
      value.forEachNodeEdge(nodeId, (edgeId) => {
        const edge = value.getEdge(edgeId)
        if (edge && edge.from === nodeId) {
          edgeIds.push(edgeId)
        }
      })

      nodes[nodeId] = {
        edges: edgeIds,
        ...(node.weight !== undefined ? { weight: node.weight } : {})
      }
    })

    value.forEachEdge((edgeId) => {
      const edge = value.getEdge(edgeId)
      if (!edge) {
        return
      }

      edges[edgeId] = {
        from: edge.from,
        to: edge.to,
        ...(edge.weight !== undefined ? { weight: edge.weight } : {})
      }
    })

    return {
      directed: value.directed,
      nodes,
      edges
    }
  }

  static validSerial<T, U>(value: unknown): value is GraphSerial<T, U> {
    return validateGraphSerial<T, U>(value)
  }

  static deserialize<T, U>(value: GraphSerial<T, U>, out = new StableGraph<T, U>(value.directed)) {
    const nodeIds = Object.keys(value.nodes)
      .map((key) => Number(key) as NodeId)
      .sort((left, right) => left - right)
    const edgeIds = Object.keys(value.edges)
      .map((key) => Number(key) as EdgeId)
      .sort((left, right) => left - right)

    out.nodes = []
    out.edges = []
    out.nodeIdAllocator = new IndexAllocator<NodeId>()
    out.edgeIdAllocator = new IndexAllocator<EdgeId>()
    out.nodeCount = 0
    out.edgeCount = 0

    for (const nodeId of nodeIds) {
      const node = value.nodes[nodeId] as NonNullable<GraphSerial<T, U>['nodes'][NodeId]>
      out.nodes[nodeId] = new Node(node.weight as T)
      out.nodeCount += 1
    }

    for (const edgeId of edgeIds) {
      const edge = value.edges[edgeId] as NonNullable<GraphSerial<T, U>['edges'][EdgeId]>
      out.edges[edgeId] = new Edge(edge.from, edge.to, edge.weight as U)
      out.edgeCount += 1
    }

    const maxNodeId = nodeIds.length ? nodeIds[nodeIds.length - 1] : -1
    const maxEdgeId = edgeIds.length ? edgeIds[edgeIds.length - 1] : -1

    for (let id = 0; id <= maxNodeId; id += 1) {
      out.nodeIdAllocator.reserve()
    }

    for (let id = maxNodeId; id >= 0; id -= 1) {
      if (!hasOwnProperty(value.nodes, id)) {
        out.nodeIdAllocator.recycle(id as NodeId)
      }
    }

    for (let id = 0; id <= maxEdgeId; id += 1) {
      out.edgeIdAllocator.reserve()
    }

    for (let id = maxEdgeId; id >= 0; id -= 1) {
      if (!hasOwnProperty(value.edges, id)) {
        out.edgeIdAllocator.recycle(id as EdgeId)
      }
    }

    const outgoing = new Map<NodeId, EdgeId[]>()
    const incoming = new Map<NodeId, EdgeId[]>()

    for (const [nodeIdText] of Object.entries(value.nodes)) {
      const nodeId = Number(nodeIdText) as NodeId
      outgoing.set(nodeId, [])
      incoming.set(nodeId, [])
    }

    for (const [nodeIdText, nodeRaw] of Object.entries(value.nodes)) {
      const node = nodeRaw as NonNullable<GraphSerial<T, U>['nodes'][NodeId]>
      const nodeId = Number(nodeIdText) as NodeId
      const outgoingEdges = outgoing.get(nodeId) as EdgeId[]

      for (const edgeId of node.edges) {
        outgoingEdges.push(edgeId)
      }
    }

    for (const [edgeIdText, edgeRaw] of Object.entries(value.edges)) {
      const edge = edgeRaw as NonNullable<GraphSerial<T, U>['edges'][EdgeId]>
      const edgeId = Number(edgeIdText) as EdgeId
      incoming.get(edge.from)?.push(edgeId)
      incoming.get(edge.to)?.push(edgeId)
    }

    for (const [nodeIdText] of Object.entries(value.nodes)) {
      const nodeId = Number(nodeIdText) as NodeId
      const graphNode = out.nodes[nodeId] as Node<T>

      const outgoingEdges = outgoing.get(nodeId) ?? []
      for (let index = outgoingEdges.length - 1; index >= 0; index -= 1) {
        const edge = out.edges[outgoingEdges[index]]
        const serialEdge = edge as Edge<U>

        serialEdge.next[0] = graphNode.next[0]
        graphNode.next[0] = outgoingEdges[index]
      }

      const incomingEdges = incoming.get(nodeId) ?? []
      for (let index = incomingEdges.length - 1; index >= 0; index -= 1) {
        const edge = out.edges[incomingEdges[index]]
        const serialEdge = edge as Edge<U>

        serialEdge.next[1] = graphNode.next[1]
        graphNode.next[1] = incomingEdges[index]
      }
    }

    return out
  }
}
