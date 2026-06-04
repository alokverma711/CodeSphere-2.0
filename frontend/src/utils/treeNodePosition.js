import dagre from 'dagre';

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // 1. Set the layout direction and node size
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 20,
    ranksep: 80,
    marginx: 20,
    marginy: 20,
    ranker: 'tight-tree'
  });

  // 2. Add nodes to dagre
  const NODE_W = 200;
  const NODE_H = 38;
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_W, height: NODE_H });
  });

  // 3. Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 4. Calculate layout
  dagre.layout(dagreGraph);

  // 5. Map the calculated positions back to React Flow nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_W / 2,
        y: nodeWithPosition.y - NODE_H / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
export default getLayoutedElements;