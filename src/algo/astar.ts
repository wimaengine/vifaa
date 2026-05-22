import type { CostFunc } from '../types'
import type { Graph, NodeId } from '../structs/graphs/graph'
import { GraphPath, GraphPathNode } from '../structs/graphs/path'
import { PriorityQueue } from '../structs/priorityqueue'

export function aStar<T, U>(
  graph: Graph<T, U>,
  costFunc: CostFunc<T>,
  start: NodeId,
  end: NodeId,
): GraphPath {
  const target = graph.getNode(end)
  if (!target) {
    return new GraphPath()
  }

  const visited = new Set<NodeId>()
  const unvisited = new PriorityQueue<[NodeId, number]>((a, b) => a[1] < b[1])
  const path = new GraphPath()

  unvisited.push([start, 0])

  const startNode = graph.getNode(start)
  if (!startNode) {
    return path
  }

  path.set(start, new GraphPathNode(undefined, 0, costFunc(startNode.weight, target.weight)))

  while (unvisited.size()) {
    const popped = unvisited.pop()
    if (!popped) {
      break
    }

    const currentid = popped[0]
    const current = graph.getNode(currentid)
    if (!current) {
      continue
    }

    visited.add(currentid)

    if (currentid === end) {
      break
    }

    graph.forEachNeighbour(currentid, (neighbourid) => {
      if (visited.has(neighbourid)) {
        return
      }

      const neighbour = graph.getNode(neighbourid)
      if (!neighbour) {
        return
      }

      const neighborPathNode = path.get(neighbourid)
      const currentPathNode = path.get(currentid)
      if (!currentPathNode) {
        return
      }

      const cost = currentPathNode.gCost + costFunc(current.weight, neighbour.weight)

      if (neighborPathNode) {
        if (cost < neighborPathNode.gCost) {
          neighborPathNode.gCost = cost
          neighborPathNode.parent = currentid
        }
      } else {
        unvisited.push([neighbourid, cost])
        path.set(neighbourid, new GraphPathNode(currentid, cost, costFunc(neighbour.weight, target.weight)))
      }
    })
  }

  return path
}
