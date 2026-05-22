import type { CostFunc } from '../types'
import type { Graph, NodeId } from '../structs/graphs/graph'
import { GraphPath, GraphPathNode } from '../structs/graphs/path'

export function dijkstra<T, U>(
  graph: Graph<T, U>,
  costFunc: CostFunc<T>,
  start: NodeId,
  end: NodeId | undefined = undefined,
): GraphPath {
  const visited = new Set<NodeId>()
  const unvisited: NodeId[] = [start]
  const path = new GraphPath()

  path.set(start, new GraphPathNode(undefined, 0))

  while (unvisited.length) {
    unvisited.sort(
      (a, b) =>
        (path.get(a)?.gCost ?? Number.MAX_SAFE_INTEGER)
        - (path.get(b)?.gCost ?? Number.MAX_SAFE_INTEGER),
    )

    const currentid = unvisited.shift()
    if (currentid === undefined) {
      break
    }

    if (end !== undefined && currentid === end) {
      break
    }

    visited.add(currentid)
    const current = graph.getNode(currentid)
    const currentPathNode = path.getOrSet(currentid)

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
        }
      } else {
        unvisited.push(neighbourid)
        path.set(neighbourid, new GraphPathNode(currentid, cost))
      }
    })
  }

  return path
}
