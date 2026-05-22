import type { Graph, NodeId } from '../structs/graphs/graph'

export function dfs<T, U>(graph: Graph<T, U>, start: NodeId, visit: (nodeId: NodeId) => void): void {
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
