import type { EdgeAccessor, EdgeId, NodeEdgeIterable, NodeId } from '../core'
import type { CostFunc } from '../types'
import { GraphPath, GraphPathNode } from '../structs'
import { PriorityQueue } from '../structs'
import type { Edge } from '../structs'

export function dijkstra(
  graph: EdgeAccessor<Edge<unknown>, EdgeId> & NodeEdgeIterable<NodeId, EdgeId>,
  costFunc: CostFunc<EdgeId>,
  start: NodeId,
  end: NodeId | undefined = undefined,
): GraphPath<NodeId> {
  const visited = new Set<NodeId>()
  const unvisited = new PriorityQueue<[NodeId, number]>((a, b) => a[1] < b[1])
  const path = new GraphPath<NodeId>()

  path.set(start, new GraphPathNode<NodeId>(undefined, 0))
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
    graph.forEachNodeEdge(currentid, (edgeid) => {
      const edge = graph.getEdge(edgeid)

      if(!edge){
        return
      }

      const neighbourid = edge.from === currentid ? edge.to : edge.from
      if (visited.has(neighbourid)) {
        return
      }

      const cost = currentPathNode.gCost + costFunc(edgeid)
      const neighborPathNode = path.get(neighbourid)

      if (neighborPathNode) {
        if (cost < neighborPathNode.gCost) {
          neighborPathNode.gCost = cost
          neighborPathNode.parent = currentid
          unvisited.push([neighbourid, cost])
        }
      } else {
        path.set(neighbourid, new GraphPathNode<NodeId>(currentid, cost))
        unvisited.push([neighbourid, cost])
      }
    })
  }

  return path
}
