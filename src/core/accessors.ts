export interface NodeAccessor<Node, NodeId extends number = number> {
  getNode(id: NodeId): Node | undefined
  getNodes(): Iterable<Node>
  getNodeCount(): number
}

export interface EdgeAccessor<Edge, EdgeId extends number = number> {
  getEdge(id: EdgeId): Edge | undefined
  getEdges(): Iterable<Edge>
  getEdgeCount(): number
}
