export interface NeighbourIterable<NodeId extends number = number> {
  forEachNeighbour(id: NodeId, callback: (nodeId: NodeId) => void): void
}

export interface NodeIterable<NodeId extends number = number> {
  forEachNode(callback: (nodeId: NodeId) => void): void
}

export interface NodeEdgeIterable<NodeId extends number = number, EdgeId extends number = number> {
  forEachNodeEdge(id: NodeId, callback: (edgeId: EdgeId) => void): void
}
