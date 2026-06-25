import type { EdgeAccessor, EdgeIterable, NeighbourIterable, NodeAccessor, NodeIterable } from '../core'
import type { NodeId } from '../core/identifiers'
import type { Edge } from '../structs/graphs/graph'

export function kahnTopologySort<T, U>(graph: NodeAccessor<T, NodeId> & EdgeAccessor<Edge<U>> & NodeIterable<NodeId> & EdgeIterable<NodeId> & NeighbourIterable<NodeId>): NodeId[] | undefined {
  const nodeCount = graph.getNodeCount()
  const inDegree = new Map<NodeId, number>()

  graph.forEachNode((nodeId) => {
    inDegree.set(nodeId, 0)
  })

  graph.forEachEdge((edgeId) => {
    const edge = graph.getEdge(edgeId)
    if (!edge) {
      return
    }

    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1)
  })

  const queue: NodeId[] = []
  graph.forEachNode((nodeId) => {
    if ((inDegree.get(nodeId) ?? 0) === 0) {
      queue.push(nodeId)
    }
  })

  const sorted: NodeId[] = []
  let head = 0

  while (head < queue.length) {
    const nodeId = queue[head]
    sorted.push(nodeId)

    graph.forEachNeighbour(nodeId, (neigh) => {
      const degree = (inDegree.get(neigh) ?? 0) - 1
      inDegree.set(neigh, degree)
      if (degree === 0) {
        queue.push(neigh)
      }
    })

    head += 1
  }

  return sorted.length === nodeCount ? sorted : undefined
}
