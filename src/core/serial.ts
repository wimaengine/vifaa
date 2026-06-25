import type { EdgeId, NodeId } from './identifiers'

export type NodeSerial<T = unknown> = {
  next: [EdgeId | undefined, EdgeId | undefined]
  weight: T
}

export type EdgeSerial<T = unknown> = {
  from: NodeId
  to: NodeId
  next: [EdgeId | undefined, EdgeId | undefined]
  weight: T
}
