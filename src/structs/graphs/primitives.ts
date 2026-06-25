import type { EdgeId, NodeId } from '../../core/identifiers'

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
