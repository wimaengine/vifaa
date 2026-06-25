import type { EdgeAccessor, NodeAccessor, NodeEdgeIterable } from '../core'
import type { CostFunc, HeuristicFunc } from '../types'
import type { EdgeId, NodeId } from '../core/identifiers'
import type { Edge, Node } from '../structs/graphs'
import { GraphPath, GraphPathNode } from '../structs'
import { PriorityQueue } from '../structs'

export function aStar(
  graph: NodeAccessor<Node<unknown>, NodeId> & EdgeAccessor<Edge<unknown>, EdgeId> & NodeEdgeIterable<NodeId, EdgeId>,
  costFunc: CostFunc<EdgeId>,
  heuristicFunc: HeuristicFunc,
  start: NodeId,
  end: NodeId,
): GraphPath<NodeId> {
  const target = graph.getNode(end)
  if (!target) {
    return new GraphPath()
  }

  const visited = new Set<NodeId>()
  const unvisited = new PriorityQueue<[NodeId, number]>((a, b) => a[1] < b[1])
  const path = new GraphPath<NodeId>()

  if (!graph.getNode(start)) {
    return path
  }

  const startHCost = heuristicFunc(start, end)
  path.set(start, new GraphPathNode<NodeId>(undefined, 0, startHCost))
  unvisited.push([start, startHCost])

  while (unvisited.size()) {
    const popped = unvisited.pop()
    if (!popped) {
      break
    }

    const currentid = popped[0]
    const currentPathNode = path.get(currentid)
    if (!currentPathNode || !graph.getNode(currentid) || visited.has(currentid) || currentPathNode.fCost() !== popped[1]) {
      continue
    }

    visited.add(currentid)

    if (currentid === end) {
      break
    }

    graph.forEachNodeEdge(currentid, (edgeid) => {
      const edge = graph.getEdge(edgeid)
      if (!edge) {
        return
      }

      const neighbourid = (edge.from === currentid ? edge.to : edge.from) as NodeId
      if (visited.has(neighbourid)) {
        return
      }

      const neighborPathNode = path.get(neighbourid)
      const cost = currentPathNode.gCost + costFunc(edgeid)

      if (neighborPathNode) {
        if (cost < neighborPathNode.gCost) {
          neighborPathNode.gCost = cost
          neighborPathNode.hCost = heuristicFunc(neighbourid, end)
          neighborPathNode.parent = currentid
          unvisited.push([neighbourid, cost + neighborPathNode.hCost])
        }
      } else {
        const hCost = heuristicFunc(neighbourid, end)
        unvisited.push([neighbourid, cost + hCost])
        path.set(neighbourid, new GraphPathNode<NodeId>(currentid, cost, hCost))
      }
    })
  }

  return path
}
