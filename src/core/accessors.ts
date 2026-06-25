export interface NodeAccessor<Node, NodeId extends number = number> {
  getNode(id: NodeId): Node | undefined
  getNodeCount(): number
}

export interface EdgeAccessor<Edge, EdgeId extends number = number> {
  getEdge(id: EdgeId): Edge | undefined
  getEdgeCount(): number
}
