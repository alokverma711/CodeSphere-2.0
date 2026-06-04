import * as d3 from 'd3-force';

export const getForceLayoutedElements = (nodes, edges) => {
  if (!nodes || nodes.length === 0) return { nodes, edges };

  // Identify root node to anchor in the center
  let rootNode = nodes.find(n => n.data.label === 'index.js' || n.data.label === 'App.jsx' || n.data.label === 'main.jsx');
  if (!rootNode) {
      const outDegree = {};
      edges.forEach(e => { outDegree[e.source] = (outDegree[e.source] || 0) + 1; });
      rootNode = nodes.reduce((max, n) => (outDegree[n.id] || 0) > (outDegree[max.id] || 0) ? n : max, nodes[0]);
  }

  const d3Edges = edges.map(e => ({ ...e }));

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(d3Edges).id(d => d.id).distance(250)) // Long sweeping edges
    .force("charge", d3.forceManyBody().strength(-1000)) // Strong repulsion for clear spacing
    .force("collide", d3.forceCollide(d => 100)) // Ensure rectangular boxes don't overlap
    // Anchor the root node strongly to the center
    .force("x", d3.forceX(window.innerWidth / 2).strength(d => d.id === rootNode.id ? 1 : 0.02))
    .force("y", d3.forceY(window.innerHeight / 2).strength(d => d.id === rootNode.id ? 1 : 0.02))
    .stop();

  // Run the simulation for a few ticks to reach equilibrium
  for (let i = 0; i < 300; ++i) simulation.tick();

  const layoutedNodes = nodes.map(node => ({
    ...node,
    // React Flow handles the actual rendering
    position: { x: node.x, y: node.y }
  }));

  const layoutedEdges = edges.map(edge => {
      const sourceNode = layoutedNodes.find(n => n.id === edge.source);
      const targetNode = layoutedNodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;

          let sourceHandle = 'bottom-s';
          if (Math.abs(dx) > Math.abs(dy)) {
             sourceHandle = dx > 0 ? 'right-s' : 'left-s';
          } else {
             sourceHandle = dy > 0 ? 'bottom-s' : 'top-s';
          }

          let targetHandle = 'top-t';
          if (Math.abs(dx) > Math.abs(dy)) {
             targetHandle = dx > 0 ? 'left-t' : 'right-t';
          } else {
             targetHandle = dy > 0 ? 'top-t' : 'bottom-t';
          }

          return {
              ...edge,
              sourceHandle,
              targetHandle
          };
      }
      return edge;
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
};