import { useMemo } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getForceLayoutedElements } from "../../utils/graphNodePositioning";
import { FaFolder, FaCube } from 'react-icons/fa';
import './dependencyGraph.css';

// Helper: resolve a relative import path to full repo path (no extension)
function resolvePath(fromFile, importPath) {
    if (typeof importPath !== 'string') return importPath;
    let cleanImportPath = importPath.replace(/^[@~]\//, 'src/');
    if (!cleanImportPath.startsWith('.')) return cleanImportPath;
    const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
    const parts = (fromDir ? fromDir.split('/') : []).concat(cleanImportPath.split('/'));
    const resolved = [];
    for (const p of parts) {
        if (p === '.' || p === '') continue;
        if (p === '..') resolved.pop();
        else resolved.push(p);
    }
    return resolved.join('/');
}

function isPathMatch(pathA, pathB) {
    if (pathA === pathB) return true;
    if (typeof pathA !== 'string' || typeof pathB !== 'string') return false;
    const cleanA = pathA.replace(/^\//, '');
    const cleanB = pathB.replace(/^\//, '');
    if (cleanA === cleanB) return true;
    if (cleanA.endsWith('/' + cleanB) || cleanB.endsWith('/' + cleanA)) return true;
    return false;
}

// ---------------------------------------------------------------------------
// Build dependency graph nodes + edges from the backend tree.
// Each file node has imports[] = [{ name, path, isExternal, line }]
// ---------------------------------------------------------------------------
function buildDependencyData(treeRoot) {
    const nodes = {};
    const rawEdges = [];

    // Collect all file paths first (for edge resolution)
    const allFilePaths = new Set();
    const collectPaths = (node) => {
        if (!node.children) {
            allFilePaths.add(node.path);
            // Try common extension variants
            const base = node.path.replace(/\.[^.]+$/, '');
            allFilePaths.add(base);
        } else {
            (node.children || []).forEach(collectPaths);
        }
    };
    if (treeRoot) collectPaths(treeRoot);

    // Recursive walk
    const walk = (node) => {
        if (!node.children) {
            // File node
            const id = node.path;
            if (!nodes[id]) {
                nodes[id] = {
                    id,
                    type: 'file',
                    data: { label: node.name, path: node.path, role: node.role || 'utility' },
                    position: { x: 0, y: 0 }
                };
            }
            // Create edges from imports
            (node.imports || []).forEach(imp => {
                const edgeId = `${id}__${imp.path}`;
                rawEdges.push({
                    id: edgeId,
                    source: id,
                    rawTarget: imp.path,
                    isExternal: imp.isExternal,
                    importName: imp.name
                });
            });
        } else {
            (node.children || []).forEach(walk);
        }
    };

    if (treeRoot) walk(treeRoot);

    // Resolve edge targets relative to source file
    const resolveTarget = (rawTarget, isExternal, sourceFile) => {
        if (isExternal) return rawTarget; // external package
        const resolved = resolvePath(sourceFile, rawTarget);
        if (!resolved) return null;

        const nodeKeys = Object.keys(nodes);

        // 1. Direct or suffix match
        const exactMatch = nodeKeys.find(key => isPathMatch(key, resolved));
        if (exactMatch) return exactMatch;

        // 2. Try common extensions
        const exts = ['.js', '.jsx', '.ts', '.tsx', '.py', '/index.js', '/index.jsx', '/index.ts'];
        for (const ext of exts) {
            const variant = resolved + ext;
            const match = nodeKeys.find(key => isPathMatch(key, variant));
            if (match) return match;
        }

        return null; // can't resolve → treat as external
    };

    const validEdges = [];
    rawEdges.forEach(edge => {
        if (!nodes[edge.source]) return;

        let targetId = null;
        let isExt = edge.isExternal;

        if (!isExt) {
            targetId = resolveTarget(edge.rawTarget, false, edge.source);
            if (!targetId) isExt = true; // couldn't resolve internal → mark external
        }

        if (isExt) {
            targetId = edge.rawTarget;
            if (!nodes[targetId]) {
                nodes[targetId] = {
                    id: targetId,
                    type: 'external',
                    data: { label: edge.importName || targetId, path: '/node_modules' },
                    position: { x: 0, y: 0 }
                };
            }
        }

        if (!targetId || targetId === edge.source) return;

        validEdges.push({
            id: edge.id,
            source: edge.source,
            target: targetId,
            type: 'default',
            animated: isExt,
            markerEnd: { type: 'arrowclosed', width: 14, height: 14, color: '#3b82f6' },
            style: { stroke: '#3b82f6', strokeWidth: 1.5, opacity: 0.7 }
        });
    });

    return { nodes: Object.values(nodes), edges: validEdges };
}

// ---------------------------------------------------------------------------
// Node renderers
// ---------------------------------------------------------------------------
const HandleSet = () => (
    <>
        {/* Source Handles */}
        <Handle type="source" position={Position.Top} id="top-s" style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Bottom} id="bottom-s" style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Left} id="left-s" style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Right} id="right-s" style={{ visibility: 'hidden' }} />

        {/* Target Handles */}
        <Handle type="target" position={Position.Top} id="top-t" style={{ visibility: 'hidden' }} />
        <Handle type="target" position={Position.Bottom} id="bottom-t" style={{ visibility: 'hidden' }} />
        <Handle type="target" position={Position.Left} id="left-t" style={{ visibility: 'hidden' }} />
        <Handle type="target" position={Position.Right} id="right-t" style={{ visibility: 'hidden' }} />
    </>
);

const getExtInfo = (name) => {
    if (name.endsWith('.jsx') || name.endsWith('.tsx')) return { text: 'RE', cls: 'dep-icon-react' };
    if (name.endsWith('.css')) return { text: 'CSS', cls: 'dep-icon-css' };
    if (name.endsWith('.ts')) return { text: 'TS', cls: 'dep-icon-js' };
    if (name.endsWith('.py')) return { text: 'PY', cls: 'dep-icon-py' };
    if (name.endsWith('.java')) return { text: 'J', cls: 'dep-icon-java' };
    return { text: 'JS', cls: 'dep-icon-js' };
};

const FileNode = ({ data }) => {
    const ext = getExtInfo(data.label);
    const shortPath = '/' + (data.path ? data.path.split('/').slice(0, -1).join('/') : '');
    return (
        <div className={`dep-node-file`}>
            <HandleSet />
            <div className={`dep-node-icon-box ${ext.cls}`}>{ext.text}</div>
            <div className="dep-node-text">
                <span className="dep-node-label">{data.label}</span>
                <span className="dep-node-path">{shortPath === '/' ? '/' : shortPath}</span>
            </div>
        </div>
    );
};

const ExternalNode = ({ data }) => (
    <div className="dep-node-external">
        <HandleSet />
        <div className="dep-node-icon-box dep-icon-ext"><FaCube size={12} /></div>
        <div className="dep-node-text">
            <span className="dep-node-label">{data.label}</span>
            <span className="dep-node-path">/node_modules</span>
        </div>
    </div>
);

const nodeTypes = { file: FileNode, external: ExternalNode };

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
function DependencyGraph({ repoData, repoName, onNodeClick }) {
    const { nodes, edges } = useMemo(() => {
        if (!repoData) return { nodes: [], edges: [] };
        const raw = buildDependencyData(repoData);
        return getForceLayoutedElements(raw.nodes, raw.edges);
    }, [repoData]);

    const externalCount = nodes.filter(n => n.type === 'external').length;
    const internalCount = nodes.filter(n => n.type === 'file').length;

    return (
        <div className="dep-graph-container">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => {
                    if (node.type === 'file') {
                        onNodeClick?.({ name: node.data.label, path: node.data.path, type: 'file' });
                    }
                }}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.05}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant="dots" gap={20} size={1} color="rgba(15, 23, 42, 0.08)" />
                <Controls showInteractive={false} className="dep-custom-controls" />
                <MiniMap
                    style={{ border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)', backgroundColor: 'var(--bg-secondary)' }}
                    maskColor="rgba(248, 250, 252, 0.6)"
                />
                <Panel position="top-left" className="dep-panel-left">
                    <div className="dep-stat-card">
                        <FaFolder color="var(--text-muted)" size={16} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{repoName}</span>
                    </div>
                    <div className="dep-stat-card dep-col">
                        <span className="dep-stat-title">Files</span>
                        <span className="dep-stat-value" style={{ color: 'var(--accent-purple)' }}>{internalCount}</span>
                    </div>
                    <div className="dep-stat-card dep-col">
                        <span className="dep-stat-title">Import Links</span>
                        <span className="dep-stat-value" style={{ color: 'var(--accent-secondary)' }}>{edges.length}</span>
                    </div>
                    <div className="dep-stat-card dep-col">
                        <span className="dep-stat-title">External Packages</span>
                        <span className="dep-stat-value" style={{ color: 'var(--accent-success)' }}>{externalCount}</span>
                    </div>
                </Panel>
                <Panel position="top-right" className="dep-panel-right">
                    <div className="dep-legend-item">
                        <span className="dep-legend-color" style={{ backgroundColor: '#3b82f6' }} /> Dependency
                        <span className="dep-legend-color" style={{ backgroundColor: '#3b82f6', opacity: 0.4 }} /> External Package
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export default DependencyGraph;