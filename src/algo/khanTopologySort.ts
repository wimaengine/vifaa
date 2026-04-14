import type { Graph, NodeId } from '../structs/graphs/graph'

export function kahnTopologySort<T, U>(graph: Graph<T, U>): NodeId[] | undefined {
  const nodeCount = graph.getNodeCount()
  const edges = graph.getEdges()
  const inDegree = new Array<number>(nodeCount).fill(0)

  for (const e of edges) {
    inDegree[e.to] += 1
  }

  const queue: NodeId[] = []
  for (let i = 0; i < nodeCount; i++) {
    if (inDegree[i] === 0) {
      queue.push(i)
    }
  }

  const sorted: NodeId[] = []
  let head = 0

  while (head < queue.length) {
    const nodeId = queue[head]
    sorted.push(nodeId)

    for (const neigh of graph.getNeighbours(nodeId)) {
      inDegree[neigh] -= 1
      if (inDegree[neigh] === 0) {
        queue.push(neigh)
      }
    }

    head += 1
  }

  return sorted.length === nodeCount ? sorted : undefined
}
