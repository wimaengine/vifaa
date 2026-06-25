import type { EdgeAccessor, NeighbourIterable, NodeAccessor } from '../core'
import type { NodeId } from '../core/identifiers'
import type { Edge } from '../structs/graphs/graph'

export function kahnTopologySort<T, U>(graph: NodeAccessor<T> & EdgeAccessor<Edge<U>> & NeighbourIterable<NodeId>): NodeId[] | undefined {
  const nodeCount = graph.getNodeCount()
  const edges = graph.getEdges()
  const inDegree = new Array<number>(nodeCount).fill(0)

  for (const e of edges) {
    inDegree[e.to] += 1
  }

  const queue: NodeId[] = []
  for (let i = 0; i < nodeCount; i++) {
    if (inDegree[i] === 0) {
      queue.push(i as NodeId)
    }
  }

  const sorted: NodeId[] = []
  let head = 0

  while (head < queue.length) {
    const nodeId = queue[head]
    sorted.push(nodeId)

    graph.forEachNeighbour(nodeId, (neigh) => {
      inDegree[neigh] -= 1
      if (inDegree[neigh] === 0) {
        queue.push(neigh)
      }
    })

    head += 1
  }

  return sorted.length === nodeCount ? sorted : undefined
}
