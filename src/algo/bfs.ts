import type { Graph, NodeId } from '../structs/graphs/graph'

export function bfs<T, U>(graph: Graph<T, U>, start: NodeId, visit: (nodeId: NodeId) => void): void {
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
