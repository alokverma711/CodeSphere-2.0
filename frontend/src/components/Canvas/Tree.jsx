import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, { Background, Handle, Position, ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import './Tree.css';
import getLayoutedElements from '../../utils/treeNodePosition';

import { 
    FaFolder, 
    FaChevronDown, 
    FaChevronRight, 
    FaPlus, 
    FaMinus, 
    FaCompressArrowsAlt, 
    FaFolderOpen 
} from 'react-icons/fa';
import { resolveIcon } from '../../utils/icons';

/* Helper to split paths robustly across OS platforms */
const splitPath = (path) => path.split(/[/\\]+/).filter(Boolean);

/* Helper to check if parentPath is a strict ancestor of childPath */
const isDescendant = (parentPath, childPath) => {
    if (!parentPath || !childPath || parentPath === childPath) return false;
    const parentParts = splitPath(parentPath);
    const childParts = splitPath(childPath);
    if (childParts.length <= parentParts.length) return false;
    return parentParts.every((part, i) => childParts[i] === part);
};

/* Helper to check if a node is currently hidden under a collapsed directory */
const isNodeHidden = (nodePath, collapsedSet) => {
    for (const collapsedPath of collapsedSet) {
        if (isDescendant(collapsedPath, nodePath)) {
            return true;
        }
    }
    return false;
};

/* Helper to check if a node lies on the active path from root to the selected node */
const isActivePathNode = (nodePath, selectedPath) => {
    if (!selectedPath || !nodePath) return false;
    if (nodePath === selectedPath) return true;
    const nodeParts = splitPath(nodePath);
    const selParts = splitPath(selectedPath);
    if (nodeParts.length >= selParts.length) return false;
    return nodeParts.every((part, i) => selParts[i] === part);
};

/* Helper to check if an edge lies on the active path */
const isActivePathEdge = (edge, selectedPath) => {
    return isActivePathNode(edge.source, selectedPath) && isActivePathNode(edge.target, selectedPath);
};

/* --- Custom Folder Node Component --- */
const FolderNode = ({ data }) => {
    const { label, path, fileCount, isActive, isCollapsed, onToggleCollapse, onNodeClick } = data;

    const handleChevronClick = (e) => {
        e.stopPropagation();
        onToggleCollapse?.(path);
    };

    return (
        <div 
            className={`tree-node-card tree-node-folder ${isActive ? 'active-path' : ''}`} 
            onClick={() => onNodeClick?.({ name: label, path, type: 'folder' })}
        >
            <Handle type="target" position={Position.Left} className="tree-handle" />
            
            <button 
                className={`tree-node-chevron-toggle ${isCollapsed ? 'collapsed' : 'expanded'}`}
                onClick={handleChevronClick}
                title={isCollapsed ? "Expand Folder" : "Collapse Folder"}
            >
                {isCollapsed ? <FaChevronRight size={9} /> : <FaChevronDown size={9} />}
            </button>

            <span className="tree-node-icon">
                <FaFolder color="#e2b13c" size={14} />
            </span>
            <span className="tree-node-name" title={label}>{label}</span>

            {fileCount !== undefined && fileCount > 0 && (
                <span className="tree-node-badge" title={`${fileCount} files inside`}>
                    {fileCount}
                </span>
            )}

            <Handle type="source" position={Position.Right} className="tree-handle" />
        </div>
    );
};

/* --- Custom File Node Component --- */
const FileNode = ({ data }) => {
    const { label, path, isActive, onNodeClick } = data;
    const { Icon, color } = resolveIcon(label);

    return (
        <div 
            className={`tree-node-card tree-node-file ${isActive ? 'active-path' : ''}`}
            onClick={() => onNodeClick?.({ name: label, path, type: 'file' })}
        >
            <Handle type="target" position={Position.Left} className="tree-handle" />
            
            <span className="tree-node-icon">
                <Icon color={color} size={13} />
            </span>
            <span className="tree-node-name" title={label}>{label}</span>
            
            <Handle type="source" position={Position.Right} className="tree-handle" />
        </div>
    );
};

const nodeTypes = {
    folder: FolderNode,
    file: FileNode,
};

/* --- Floating Mind-Map Controls Component --- */
const FloatingMindMapControls = ({ onExpandAll, onCollapseAll }) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    return (
        <div className="mindmap-controls-panel">
            <button className="mindmap-btn" onClick={() => zoomIn()} title="Zoom In">
                <FaPlus size={11} />
            </button>
            <button className="mindmap-btn" onClick={() => zoomOut()} title="Zoom Out">
                <FaMinus size={11} />
            </button>
            <button className="mindmap-btn" onClick={() => fitView({ padding: 0.15, duration: 400 })} title="Fit Screen">
                <FaCompressArrowsAlt size={11} />
            </button>
            <div className="mindmap-btn-divider" />
            <button className="mindmap-btn" onClick={onExpandAll} title="Expand All">
                <FaFolderOpen size={11} />
            </button>
            <button className="mindmap-btn" onClick={onCollapseAll} title="Collapse All">
                <FaFolder size={11} />
            </button>
        </div>
    );
};

/* --- Inner Tree Renderer --- */
function TreeRenderer({ flatNodes, flatEdges, onNodeClick, selectedNode }) {
    const [collapsedPaths, setCollapsedPaths] = useState(new Set());

    // Toggle collapse state of a folder path
    const toggleCollapse = useCallback((path) => {
        setCollapsedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    // Expand all directories
    const expandAll = useCallback(() => {
        setCollapsedPaths(new Set());
    }, []);

    // Collapse all directories
    const collapseAll = useCallback(() => {
        const folders = flatNodes.filter(n => n.type === 'folder').map(n => n.id);
        setCollapsedPaths(new Set(folders));
    }, [flatNodes]);

    // Format & Layout nodes and edges
    const { nodes, edges } = useMemo(() => {
        if (!flatNodes || flatNodes.length === 0) return { nodes: [], edges: [] };

        // 1. Filter out nodes that are descendants of collapsed directories
        const visibleNodes = flatNodes.filter(node => !isNodeHidden(node.id, collapsedPaths));

        // 2. Filter out edges that link hidden nodes
        const visibleEdges = flatEdges.filter(edge => 
            visibleNodes.some(n => n.id === edge.source) && 
            visibleNodes.some(n => n.id === edge.target)
        );

        // 3. Compute layouts using dagre
        const layouted = getLayoutedElements(visibleNodes, visibleEdges, 'LR');

        // 4. Transform elements for ReactFlow
        const activeNodePath = selectedNode?.path || '';

        const nodesWithState = layouted.nodes.map(node => {
            const active = isActivePathNode(node.id, activeNodePath);
            return {
                ...node,
                className: active ? 'active-path-node' : 'normal-path-node',
                data: { 
                    ...node.data, 
                    isActive: active,
                    isCollapsed: collapsedPaths.has(node.id),
                    onToggleCollapse: toggleCollapse,
                    onNodeClick 
                }
            };
        });

        const edgesWithState = layouted.edges.map(edge => {
            const active = isActivePathEdge(edge, activeNodePath);
            return {
                ...edge,
                type: 'default', // Smooth curved Bezier edges
                animated: active,
                className: active ? 'active-path-edge' : 'normal-path-edge',
                style: active 
                    ? { stroke: 'url(#active-edge-grad)', strokeWidth: 3, filter: 'drop-shadow(0 0 5px rgba(99, 102, 241, 0.45))' } 
                    : { stroke: 'rgba(148, 163, 184, 0.25)', strokeWidth: 2 }
            };
        });

        return { nodes: nodesWithState, edges: edgesWithState };
    }, [flatNodes, flatEdges, collapsedPaths, selectedNode, toggleCollapse, onNodeClick]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.05}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                {/* SVG Definitions for dynamic linear gradient accents */}
                <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                    <defs>
                        <linearGradient id="active-edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#0891b2" />
                        </linearGradient>
                    </defs>
                </svg>

                <Background variant="dots" gap={20} size={1} color="rgba(15, 23, 42, 0.05)" />
                <FloatingMindMapControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
            </ReactFlow>
        </div>
    );
}

/* --- Main Tree Export wrapped in ReactFlowProvider --- */
function Tree(props) {
    return (
        <ReactFlowProvider>
            <TreeRenderer {...props} />
        </ReactFlowProvider>
    );
}

export default Tree;