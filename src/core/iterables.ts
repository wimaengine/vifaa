export interface NeighbourIterable<NodeId extends number = number> {
  forEachNeighbour(id: NodeId, callback: (nodeId: NodeId) => void): void
}

export interface EdgeIterable<NodeId extends number = number, EdgeId extends number = number> {
  forEachEdge(id: NodeId, callback: (edgeId: EdgeId) => void): void
}
