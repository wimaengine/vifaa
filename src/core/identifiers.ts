declare const nodeIdBrand: unique symbol
declare const edgeIdBrand: unique symbol

export type NodeId = number & { readonly [nodeIdBrand]: 'NodeId' }
export type EdgeId = number & { readonly [edgeIdBrand]: 'EdgeId' }
