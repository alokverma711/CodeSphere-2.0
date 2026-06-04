import { useState, useEffect, useMemo, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    Panel,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    FaRoute,
    FaBoxes,
    FaMinus,
    FaPlus,
    FaCompress,
    FaShareAlt,
    FaProjectDiagram,
    FaListOl,
    FaChevronDown,
    FaTimes
} from 'react-icons/fa';
import './TraceabilityGraph.css';

// ---------------------------------------------------------------------------
// Traceability graph node renderer
// ---------------------------------------------------------------------------
const roleColors = {
    controller: '#6366f1',
    service: '#10b981',
    repository: '#f59e0b',
    model: '#f97316',
    middleware: '#8b5cf6',
    utility: '#64748b',
    server: '#3b82f6',
    entry: '#6366f1',
    response: '#10b981',
    error: '#ef4444'
};

const HandleSet = () => (
    <>
        <Handle type="target" position={Position.Top} id="t" style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Bottom} id="b" style={{ visibility: 'hidden' }} />
        <Handle type="target" position={Position.Left} id="l" style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Right} id="r" style={{ visibility: 'hidden' }} />
    </>
);

const TraceNode = ({ data }) => {
    const color = roleColors[data.type] || '#64748b';
    return (
        <div className="trace-graph-node" style={{ borderColor: color }}>
            <HandleSet />
            <div className="trace-node-badge" style={{ background: color }}>{(data.type || 'fn').toUpperCase()}</div>
            <div className="trace-node-label">{data.label}</div>
            <div className="trace-node-file">{data.file?.split('/').pop()}</div>
        </div>
    );
};

const nodeTypes = { traceNode: TraceNode };

// ---------------------------------------------------------------------------
// Layout traceability graph nodes in a layered grid
// ---------------------------------------------------------------------------
function layoutTraceNodes(nodes, edges) {
    // Group by type in column order
    const typeOrder = ['server', 'controller', 'middleware', 'service', 'repository', 'model', 'utility'];
    const columns = {};
    nodes.forEach(n => {
        const col = typeOrder.indexOf(n.type) >= 0 ? typeOrder.indexOf(n.type) : typeOrder.length;
        if (!columns[col]) columns[col] = [];
        columns[col].push(n);
    });

    const laid = [];
    const colKeys = Object.keys(columns).sort((a, b) => a - b);
    colKeys.forEach((col, colIdx) => {
        columns[col].forEach((n, rowIdx) => {
            laid.push({
                ...n,
                type: 'traceNode',
                position: { x: colIdx * 240, y: rowIdx * 100 },
                data: { label: n.label, file: n.file, type: n.type }
            });
        });
    });
    return laid;
}

function buildRFEdges(edges) {
    return edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || 'calls',
        type: 'default',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#6366f1' },
        style: { stroke: '#6366f1', strokeWidth: 1.5, opacity: 0.7 },
        labelStyle: { fontSize: 9, fill: '#64748b' }
    }));
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function TraceabilityGraph({ traceability, apiEndpoints = [], onNodeClick }) {
    const activeEndpoints = apiEndpoints || [];

    const [selectedEndpointId, setSelectedEndpointId] = useState('');
    const [activeTab, setActiveTab] = useState('flow'); // 'flow' | 'graph'
    const [selectedStep, setSelectedStep] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close custom dropdown on clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update selection when endpoints change
    useEffect(() => {
        if (activeEndpoints.length > 0) {
            if (!selectedEndpointId || !activeEndpoints.some(ep => ep.id === selectedEndpointId)) {
                setSelectedEndpointId(activeEndpoints[0].id);
            }
        } else {
            setSelectedEndpointId('');
        }
    }, [activeEndpoints]);

    // Active endpoint
    const activeEndpoint = useMemo(
        () => activeEndpoints.find(ep => ep.id === selectedEndpointId) || activeEndpoints[0],
        [activeEndpoints, selectedEndpointId]
    );

    // Current sequence for selected endpoint
    const activeSequence = useMemo(() => {
        if (!traceability?.sequences || !activeEndpoint) return null;
        return traceability.sequences.find(s => s.endpointId === activeEndpoint.id) || null;
    }, [traceability, activeEndpoint]);

    const flowTraces = useMemo(() => ({
        steps: activeSequence?.steps || [],
        branches: activeSequence?.branches || []
    }), [activeSequence]);

    // Auto-select first step
    useEffect(() => {
        if (flowTraces.steps.length > 0) setSelectedStep(flowTraces.steps[0]);
        else setSelectedStep(null);
    }, [flowTraces]);

    // Traceability graph (ReactFlow nodes + edges)
    const { rfNodes, rfEdges } = useMemo(() => {
        if (!traceability?.nodes?.length) return { rfNodes: [], rfEdges: [] };
        const laid = layoutTraceNodes(traceability.nodes, traceability.edges || []);
        return { rfNodes: laid, rfEdges: buildRFEdges(traceability.edges || []) };
    }, [traceability]);

    // Metrics
    const totalSteps = flowTraces.steps.length + flowTraces.branches.reduce((s, b) => s + (b.steps?.length || 0), 0);
    const totalLatencyMs = flowTraces.steps.reduce((s, st) => s + (parseInt(st.latency) || 0), 0);

    // -------------------------------------------------------------------------
    // Empty state
    // -------------------------------------------------------------------------
    if (activeEndpoints.length === 0) {
        return (
            <div className="traceability-root">
                <div className="traceability-header-row">
                    <h2 className="traceability-title">Traceability Engine</h2>
                    <span className="traceability-subtitle">Map cross-functional calls and execution sequences.</span>
                </div>
                <div className="traceability-empty-container">
                    <div className="traceability-empty-card">
                        <div className="traceability-empty-icon-ring">
                            <FaRoute className="traceability-empty-icon" />
                        </div>
                        <h3>No API Endpoints Detected</h3>
                        <p>
                            No standard API routes were found in this repository.
                            Supported frameworks: Express.js, FastAPI, Flask, Spring Boot.
                        </p>
                        <div className="traceability-guide-box">
                            <h5>Common causes:</h5>
                            <ul>
                                <li>Routes use non-standard patterns not yet supported</li>
                                <li>Files use an unsupported language</li>
                                <li>Repo uses a frontend-only framework (no backend routes)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // Main render
    // -------------------------------------------------------------------------
    return (
        <div className="traceability-root">
            {/* Header */}
            <div className="traceability-header-row">
                <h2 className="traceability-title">Traceability Engine</h2>
                <span className="traceability-subtitle">Map cross-functional calls and execution sequences.</span>
            </div>

            {/* Controls bar */}
            <div className="traceability-filters-bar">
                <div className="filter-item-group">
                    <span className="filter-item-label">Endpoint</span>
                    <div className="custom-endpoint-dropdown" ref={dropdownRef}>
                        <button
                            className={`endpoint-dropdown-trigger ${dropdownOpen ? 'open' : ''}`}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            title="Select Endpoint"
                        >
                            <span className={`endpoint-trigger-method ${activeEndpoint?.method?.toLowerCase()}`}>
                                {activeEndpoint?.method || 'GET'}
                            </span>
                            <span className="endpoint-trigger-path">
                                {activeEndpoint?.path || '/'}
                            </span>
                            <FaChevronDown className={`endpoint-chevron ${dropdownOpen ? 'rotated' : ''}`} />
                        </button>
                        {dropdownOpen && (
                            <div className="endpoint-dropdown-menu">
                                {activeEndpoints.map(ep => (
                                    <div
                                        key={ep.id}
                                        className={`endpoint-dropdown-item ${ep.id === selectedEndpointId ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedEndpointId(ep.id);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        <span className={`method-tag ${ep.method.toLowerCase()}`}>{ep.method}</span>
                                        <span className="path-text">{ep.path}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="filter-item-group">
                    <span className="filter-item-label">View</span>
                    <div className="view-as-tabs">
                        <button
                            className={`view-as-tab-btn ${activeTab === 'flow' ? 'active' : ''}`}
                            onClick={() => setActiveTab('flow')}
                        >
                            <FaListOl style={{ marginRight: 5 }} /> Sequence Flow
                        </button>
                        <button
                            className={`view-as-tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
                            onClick={() => setActiveTab('graph')}
                        >
                            <FaProjectDiagram style={{ marginRight: 5 }} /> Call Graph
                        </button>
                    </div>
                </div>

                {activeTab === 'flow' && (
                    <div className="flow-controls-row">
                        <button className="flow-zoom-btn" onClick={() => setZoomLevel(p => Math.max(50, p - 10))} title="Zoom Out"><FaMinus /></button>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, display: 'flex', alignItems: 'center', width: 36, justifyContent: 'center' }}>{zoomLevel}%</span>
                        <button className="flow-zoom-btn" onClick={() => setZoomLevel(p => Math.min(150, p + 10))} title="Zoom In"><FaPlus /></button>
                        <button className="flow-zoom-btn" onClick={() => setZoomLevel(100)} title="Reset"><FaCompress /></button>
                    </div>
                )}
            </div>

            {/* Main area */}
            <div className="traceability-main-grid">
                {activeTab === 'flow' ? (
                    <>
                        {/* LEFT: Sequence flow canvas */}
                        <div className="execution-flow-panel">
                            <div className="flow-panel-header">
                                <h4 className="flow-panel-title">
                                    Execution Flow &nbsp;
                                    <span className="branch-badge">{flowTraces.branches.length} branches</span>
                                </h4>
                                {selectedStep && (
                                    <button 
                                        className="traceability-mobile-details-btn"
                                        onClick={() => setShowDetailsDrawer(true)}
                                    >
                                        <FaBoxes style={{ marginRight: 6 }} /> Step Info
                                    </button>
                                )}
                            </div>

                            <div
                                className="flow-diagram-canvas"
                                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                            >
                                {/* Unified Step Columns (Main flow + corresponding error/alternative branches aligned directly below) */}
                                <div className="flow-columns-container" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', position: 'relative' }}>
                                    {flowTraces.steps.map((step, idx) => {
                                        // Find branches belonging to this step component
                                        const stepBranches = flowTraces.branches.filter(
                                            b => b.parentStepComponent === step.component
                                        );

                                        const isSelected = selectedStep?.id === step.id;
                                        const isEntry = step.type === 'entry';

                                        return (
                                            <div key={step.id} className="flow-step-column" style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', width: '190px', position: 'relative', flexShrink: 0 }}>
                                                {/* The main Happy-Path step node */}
                                                <div style={{ position: 'relative', width: '100%' }}>
                                                    <div
                                                        className={`flow-node-card ${isSelected ? 'selected' : ''} ${isEntry ? 'entry-point' : ''}`}
                                                        style={{ width: '100%', margin: 0 }}
                                                        onClick={() => {
                                                            setSelectedStep(step);
                                                            setShowDetailsDrawer(true);
                                                        }}
                                                    >
                                                        {isEntry && <span className="node-branch-tag success">Entry</span>}
                                                        <div className="node-card-header">
                                                            <span className="node-step-number">{step.num}</span>
                                                            <span className="node-latency-pill">{step.latency}</span>
                                                        </div>
                                                        <span className="node-component-title">{step.component}</span>
                                                        <span className="node-function-name" title={step.name}>{step.name}</span>
                                                        <span
                                                            className="node-file-path"
                                                            title={step.file}
                                                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                onNodeClick?.({ path: step.file, name: step.name });
                                                            }}
                                                        >{step.file}</span>
                                                    </div>

                                                    {/* Connection line/arrow to the next happy-path node */}
                                                    {idx < flowTraces.steps.length - 1 && (
                                                        <div className="flow-path-arrow-right" style={{ position: 'absolute', right: '-40px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                                                    )}
                                                </div>

                                                {/* Render all branches of this step vertically below it */}
                                                {stepBranches.length > 0 && (
                                                    <div className="flow-step-branches" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center', position: 'relative' }}>
                                                        {/* Vertical line linking parent to the first branch */}
                                                        <div className="flow-branch-vertical-line" style={{ width: '2px', height: '32px', background: 'rgba(255, 255, 255, 0.15)', position: 'absolute', top: '-32px', left: '50%', transform: 'translateX(-50%)' }}>
                                                            <div style={{
                                                                position: 'absolute',
                                                                bottom: 0,
                                                                left: '50%',
                                                                transform: 'translateX(-50%)',
                                                                width: 0,
                                                                height: 0,
                                                                borderLeft: '4px solid transparent',
                                                                borderRight: '4px solid transparent',
                                                                borderTop: '6px solid rgba(255, 255, 255, 0.15)'
                                                            }} />
                                                        </div>

                                                        {stepBranches.map((branch, bIdx) => (
                                                            <div key={bIdx} className="branch-path-container" style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                {/* Vertical line between multiple stacked branches */}
                                                                {bIdx > 0 && (
                                                                    <div className="flow-branch-vertical-line" style={{ width: '2px', height: '24px', background: 'rgba(255, 255, 255, 0.15)', position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)' }}>
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            bottom: 0,
                                                                            left: '50%',
                                                                            transform: 'translateX(-50%)',
                                                                            width: 0,
                                                                            height: 0,
                                                                            borderLeft: '4px solid transparent',
                                                                            borderRight: '4px solid transparent',
                                                                            borderTop: '6px solid rgba(255, 255, 255, 0.15)'
                                                                        }} />
                                                                    </div>
                                                                )}

                                                                {branch.steps?.map((bStep, sIdx) => {
                                                                    const isBSelected = selectedStep?.id === bStep.id;
                                                                    const isErrorBranch = branch.isError === true;
                                                                    return (
                                                                        <div key={bStep.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                                                            <div
                                                                                className={`flow-node-card ${isBSelected ? 'selected' : ''} ${isErrorBranch ? 'branch-error' : 'branch-alternative'}`}
                                                                                style={{ width: '100%', margin: 0 }}
                                                                                onClick={() => {
                                                                                    setSelectedStep(bStep);
                                                                                    setShowDetailsDrawer(true);
                                                                                }}
                                                                            >
                                                                                {sIdx === 0 && (
                                                                                    <span className={`node-branch-tag ${isErrorBranch ? 'error-flow' : 'alternative-flow'}`}>
                                                                                        {branch.name || 'Branch'}
                                                                                    </span>
                                                                                )}
                                                                                <div className="node-card-header">
                                                                                    <span className="node-step-number">{bStep.num}</span>
                                                                                    <span className="node-latency-pill">{bStep.latency}</span>
                                                                                </div>
                                                                                <span className="node-component-title">{bStep.component}</span>
                                                                                <span className="node-function-name" title={bStep.name}>{bStep.name}</span>
                                                                                <span className="node-file-path" title={bStep.file}>{bStep.file}</span>
                                                                            </div>
                                                                            {sIdx < branch.steps.length - 1 && (
                                                                                <div className="flow-branch-vertical-line" style={{ width: '2px', height: '24px', background: 'rgba(255, 255, 255, 0.15)', margin: '4px 0', position: 'relative' }}>
                                                                                    <div style={{
                                                                                        position: 'absolute',
                                                                                        bottom: 0,
                                                                                        left: '50%',
                                                                                        transform: 'translateX(-50%)',
                                                                                        width: 0,
                                                                                        height: 0,
                                                                                        borderLeft: '4px solid transparent',
                                                                                        borderRight: '4px solid transparent',
                                                                                        borderTop: '6px solid rgba(255, 255, 255, 0.15)'
                                                                                    }} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flow-diagram-legend">
                                <div className="legend-items-group">
                                    <div className="legend-item"><span className="legend-color-dot entry" /> Entry Point</div>
                                    <div className="legend-item"><span className="legend-color-dot success" /> Main Flow</div>
                                    {flowTraces.branches.some(b => !b.isError) && (
                                        <div className="legend-item"><span className="legend-color-dot alternative" /> Alternative Branch</div>
                                    )}
                                    {flowTraces.branches.some(b => b.isError) && (
                                        <div className="legend-item"><span className="legend-color-dot error-dot" /> Error Branch</div>
                                    )}
                                </div>
                                <div className="legend-stats-metrics">
                                    <span>Steps: <strong>{totalSteps}</strong></span>
                                    <span>Est. Time: <strong>{totalLatencyMs}ms</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Step details */}
                        {showDetailsDrawer && (
                            <div 
                                className="details-drawer-backdrop"
                                onClick={() => setShowDetailsDrawer(false)}
                            />
                        )}
                        <div className={`step-details-sidebar ${showDetailsDrawer ? 'open-drawer' : ''}`}>
                            <div className="step-details-header">
                                <h4 className="step-details-title">Step Details</h4>
                                <button 
                                    className="step-details-close-btn"
                                    onClick={() => setShowDetailsDrawer(false)}
                                    title="Close Step Details"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            {selectedStep ? (
                                <div className="step-details-body">
                                    <div className="step-identity-row">
                                        <span className="step-details-number">{selectedStep.num}</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="step-details-component-name">{selectedStep.component}</span>
                                            <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{selectedStep.type}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="details-sec-title">Overview</h5>
                                        <p className="details-overview-text">{selectedStep.overview}</p>
                                    </div>

                                    <div>
                                        <h5 className="details-sec-title">Source File</h5>
                                        <div className="details-file-container">
                                            <span className="details-file-path" title={selectedStep.file}>{selectedStep.file}</span>
                                            <span className="file-static-label">Static</span>
                                        </div>
                                    </div>

                                    {selectedStep.keyFunctions?.length > 0 && (
                                        <div>
                                            <h5 className="details-sec-title">Functions Called</h5>
                                            <div className="details-mono-list">
                                                {selectedStep.keyFunctions.map((fn, i) => (
                                                    <span key={i} className="details-mono-item">{fn}()</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedStep.inputs?.length > 0 && (
                                        <div>
                                            <h5 className="details-sec-title">Inputs</h5>
                                            <div className="details-schema-table">
                                                {selectedStep.inputs.map((inp, i) => (
                                                    <div key={i} className="schema-table-row">
                                                        <span className="schema-param-name">{inp.name}</span>
                                                        <span className="schema-param-type">{inp.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedStep.outputs?.length > 0 && (
                                        <div>
                                            <h5 className="details-sec-title">Outputs</h5>
                                            <div className="details-schema-table">
                                                {selectedStep.outputs.map((out, i) => (
                                                    <div key={i} className="schema-table-row">
                                                        <span className="schema-param-name">{out.name}</span>
                                                        <span className="schema-param-type">{out.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                                        <h5 className="details-sec-title">Connected To</h5>
                                        <div className="details-connections-grid">
                                            <div className="connection-card-row">
                                                <span className="connection-card-label">← From</span>
                                                <span className="connection-card-value">{selectedStep.prevStep}</span>
                                            </div>
                                            <div className="connection-card-row">
                                                <span className="connection-card-label">→ Next</span>
                                                <span className="connection-card-value">{selectedStep.nextStep}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="step-details-body">
                                    <div className="details-empty-state">
                                        <FaBoxes className="empty-state-icon" />
                                        <h4>No Step Selected</h4>
                                        <p>Click any node in the flow to see its details.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* CALL GRAPH TAB */
                    <div className="trace-call-graph-panel">
                        {rfNodes.length > 0 ? (
                            <ReactFlow
                                nodes={rfNodes}
                                edges={rfEdges}
                                nodeTypes={nodeTypes}
                                onNodeClick={(_, node) => {
                                    onNodeClick?.({ path: node.data.file, name: node.data.label });
                                }}
                                fitView
                                fitViewOptions={{ padding: 0.15 }}
                                minZoom={0.05}
                                maxZoom={2}
                                proOptions={{ hideAttribution: true }}
                            >
                                <Background variant="dots" gap={20} size={1} color="rgba(15, 23, 42, 0.08)" />
                                <Controls showInteractive={false} />
                                <Panel position="top-left" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-secondary)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>{rfNodes.length}</strong> functions &nbsp;·&nbsp; <strong style={{ color: 'var(--text-primary)' }}>{rfEdges.length}</strong> call relationships
                                </Panel>
                                <Panel position="top-right" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {Object.entries(roleColors).slice(0, 6).map(([role, color]) => (
                                        <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                                            {role}
                                        </div>
                                    ))}
                                </Panel>
                            </ReactFlow>
                        ) : (
                            <div className="traceability-empty-container">
                                <div className="traceability-empty-card">
                                    <div className="traceability-empty-icon-ring">
                                        <FaProjectDiagram className="traceability-empty-icon" />
                                    </div>
                                    <h3>No Call Relationships Found</h3>
                                    <p>No function-to-function calls could be resolved statically. This happens when functions don't call each other or use dynamic dispatch patterns.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
