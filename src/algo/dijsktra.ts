import type { NodeAccessor, NeighbourIterable } from '../core'
import type { CostFunc } from '../types'
import type { Node, NodeId } from '../structs/graphs/graph'
import { GraphPath, GraphPathNode } from '../structs/graphs/path'
import { PriorityQueue } from '../structs/priorityqueue'

export function dijkstra<T>(
  graph: NodeAccessor<Node<T>, NodeId> & NeighbourIterable<NodeId>,
  costFunc: CostFunc<T>,
  start: NodeId,
  end: NodeId | undefined = undefined,
): GraphPath {
  const visited = new Set<NodeId>()
  const unvisited = new PriorityQueue<[NodeId, number]>((a, b) => a[1] < b[1])
  const path = new GraphPath()

  path.set(start, new GraphPathNode(undefined, 0))
  unvisited.push([start, 0])

  while (unvisited.size()) {
    const popped = unvisited.pop()
    if (!popped) {
      break
    }

    const [currentid, currentCost] = popped
    const currentPathNode = path.get(currentid)
    if (!currentPathNode || visited.has(currentid) || currentPathNode.gCost !== currentCost) {
      continue
    }

    if (end !== undefined && currentid === end) {
      break
    }

    visited.add(currentid)
    const current = graph.getNode(currentid)

    graph.forEachNeighbour(currentid, (neighbourid) => {
      if (visited.has(neighbourid)) {
        return
      }

      const neighbour = graph.getNode(neighbourid)
      const cost = currentPathNode.gCost + ((current && neighbour) ? costFunc(current.weight, neighbour.weight) : 0)
      const neighborPathNode = path.get(neighbourid)

      if (neighborPathNode) {
        if (cost < neighborPathNode.gCost) {
          neighborPathNode.gCost = cost
          neighborPathNode.parent = currentid
          unvisited.push([neighbourid, cost])
        }
      } else {
        path.set(neighbourid, new GraphPathNode(currentid, cost))
        unvisited.push([neighbourid, cost])
      }
    })
  }

  return path
}
