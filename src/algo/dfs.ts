import type { NeighbourIterable, NodeAccessor } from '../core'
import type { NodeId } from '../structs/graphs/graph'

export function dfs<T>(graph:NodeAccessor<T> & NeighbourIterable<NodeId>, start: NodeId, visit: (nodeId: NodeId) => void): void {
  const nodeCount = graph.getNodeCount()
  const visited = new Array<boolean>(nodeCount).fill(false)
  const stack: NodeId[] = []

  stack.push(start)

  while (stack.length > 0) {
    const nodeId = stack.pop()
    if (nodeId === undefined) {
      break
    }

    if (visited[nodeId]) {
      continue
    }

    visited[nodeId] = true
    visit(nodeId)

    graph.forEachNeighbour(nodeId, (neighbour) => {
      if (!visited[neighbour]) {
        stack.push(neighbour)
      }
    })
  }
}
