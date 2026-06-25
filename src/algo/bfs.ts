import type { NeighbourIterable, NodeAccessor } from '../core'
import type { NodeId } from '../structs/graphs/graph'

export function bfs<T>(graph: NodeAccessor<T> & NeighbourIterable<NodeId>, start: NodeId, visit: (nodeId: NodeId) => void): void {
  const nodeCount = graph.getNodeCount()
  const visited = new Array<boolean>(nodeCount).fill(false)
  const queue: NodeId[] = []

  visited[start] = true
  queue.push(start)

  while (queue.length > 0) {
    const nodeId = queue.shift()
    if (nodeId === undefined) {
      break
    }

    visit(nodeId)

    graph.forEachNeighbour(nodeId, (neighbour) => {
      if (!visited[neighbour]) {
        visited[neighbour] = true
        queue.push(neighbour)
      }
    })
  }
}
