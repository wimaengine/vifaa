# Vifaa

Vifaa is a small TypeScript library for data structures and algorithms.

## Design

- **Simple core types**: numeric node/edge IDs with generic node and edge weights
- **Algorithm + data-structure split**: separate graph traversal/pathfinding and reusable containers
- **Low-level control**: APIs expose IDs directly so you can build custom workflows
- **Typed by default**: public APIs are generic and work well with TypeScript inference

## Features

### Core

Graph model:

- `Graph<TNode, TEdge>` stores node weights and edge weights separately.
- Each `addNode(weight)` returns a numeric `NodeId`.
- Each `addEdge(from, to, weight)` returns a numeric `EdgeId`.
- You can traverse adjacency with `forEachNeighbour(nodeId, callback)` and `forEachNodeEdge(nodeId, callback)`.
- Node/edge removal is unstable for performance, so IDs may be remapped after removal.

General-purpose structures:

- `PriorityQueue<T>`: heap-based queue where the highest-priority element is popped first (or lowest if you pass a min-heap comparator).
- `Bitset`: compact boolean flags in a typed array; useful for visited sets, masks, and fast set-like operations.
- `DenseList<T>`: stores values by allocated numeric slots and works well when you recycle IDs.
- `IndexAllocator`: hands out numeric IDs and reuses recycled ones.
- `GraphPath` and `GraphPathNode`: path container used by shortest-path algorithms, with parent links and cost tracking (`gCost`, `hCost`, `fCost`).

### Algorithms

Graph algorithms:

- `bfs` and `dfs` traversal helpers
- `dijkstra` shortest-path search
- `aStar` heuristic pathfinding
- `kahnTopologySort` for DAG ordering

## Example

TODO

## Usage

TODO

## Notes

- `Graph` is currently directed; algorithms assume directed neighbour iteration.
- `removeNode` and `removeEdge` use unstable removal (indices can change).
- Traversal/path results depend on edge insertion order because adjacency is linked-list based.
