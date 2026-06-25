import type { NodeId } from '../core/identifiers'

export type HeuristicFunc = (from: NodeId, to: NodeId) => number
