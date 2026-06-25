import type { NeighbourIterable, NodeAccessor } from '../core'
import type { NodeId } from '../core/identifiers'

export function bfs<T>(graph: NodeAccessor<T> & NeighbourIterable<NodeId>, start: NodeId, visit: (nodeId: NodeId) => void): void {
  const nodeCount = graph.getNodeCount()
  const visited = new Array<boolean>(nodeCount).fill(false)
  const queue: NodeId[] = []
  let head = 0

  visited[start] = true
  queue.push(start)

  while (head < queue.length) {
    const nodeId = queue[head]
    head += 1

    visit(nodeId)

    graph.forEachNeighbour(nodeId, (neighbour) => {
      if (!visited[neighbour]) {
        visited[neighbour] = true
        queue.push(neighbour)
      }
    })
  }
}
