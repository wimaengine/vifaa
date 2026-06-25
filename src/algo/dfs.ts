import type { NeighbourIterable, NodeAccessor } from '../core'
import type { NodeId } from '../structs/graphs/graph'

export function dfs<T>(graph: NodeAccessor<T> & NeighbourIterable<NodeId>, start: NodeId, visit: (nodeId: NodeId) => void): void {
  const nodeCount = graph.getNodeCount()
  const visited = new Array<boolean>(nodeCount).fill(false)
  const stack: NodeId[] = [start]
  let top = 1

  while (top > 0) {
    top -= 1
    const nodeId = stack[top]

    if (visited[nodeId]) {
      continue
    }

    visited[nodeId] = true
    visit(nodeId)

    graph.forEachNeighbour(nodeId, (neighbour) => {
      if (!visited[neighbour]) {
        stack[top] = neighbour
        top += 1
      }
    })
  }
}
