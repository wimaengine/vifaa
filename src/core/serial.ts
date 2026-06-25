import type { EdgeId, NodeId } from './identifiers'

export type GraphNodeSerial<T = unknown> = {
  edges: EdgeId[]
  weight?: T
}

export type GraphEdgeSerial<T = unknown> = {
  from: NodeId
  to: NodeId
  weight?: T
}

export type GraphSerial<T = unknown, U = unknown> = {
  directed: boolean
  nodes: Partial<Record<NodeId, GraphNodeSerial<T>>>
  edges: Partial<Record<EdgeId, GraphEdgeSerial<U>>>
}

function isIndexKey(value: string): boolean {
  return /^(0|[1-9]\d*)$/.test(value)
}

function hasOwnProperty<T extends object>(value: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isGraphNodeSerial<T>(value: unknown): value is GraphNodeSerial<T> {
  return !!value
    && typeof value === 'object'
    && Array.isArray((value as GraphNodeSerial<T>).edges)
    && (value as GraphNodeSerial<T>).edges.every((edgeId) => typeof edgeId === 'number')
}

function isGraphEdgeSerial<T>(value: unknown): value is GraphEdgeSerial<T> {
  return !!value
    && typeof value === 'object'
    && typeof (value as GraphEdgeSerial<T>).from === 'number'
    && typeof (value as GraphEdgeSerial<T>).to === 'number'
}

export function validateGraphSerial<T, U>(value: unknown): value is GraphSerial<T, U> {
  if (!value || typeof value !== 'object') {
    return false
  }

  const serial = value as GraphSerial<T, U>

  if (typeof serial.directed !== 'boolean') {
    return false
  }

  if (!serial.nodes || typeof serial.nodes !== 'object' || !serial.edges || typeof serial.edges !== 'object') {
    return false
  }

  for (const [nodeIdText, node] of Object.entries(serial.nodes)) {
    if (!isIndexKey(nodeIdText) || !isGraphNodeSerial<T>(node)) {
      return false
    }
  }

  for (const [edgeIdText, edge] of Object.entries(serial.edges)) {
    if (!isIndexKey(edgeIdText) || !isGraphEdgeSerial<U>(edge)) {
      return false
    }
  }

  for (const [nodeIdText, node] of Object.entries(serial.nodes)) {
    const nodeId = Number(nodeIdText) as NodeId
    const nodeSerial = node as GraphNodeSerial<T>

    for (const edgeId of nodeSerial.edges) {
      const edge = serial.edges[edgeId]
      if (!edge || edge.from !== nodeId) {
        return false
      }
    }
  }

  for (const [edgeIdText] of Object.entries(serial.edges)) {
    const edge = serial.edges[Number(edgeIdText) as EdgeId]
    if (!edge) {
      return false
    }

    if (!hasOwnProperty(serial.nodes, edge.from) || !hasOwnProperty(serial.nodes, edge.to)) {
      return false
    }
  }

  return true
}
