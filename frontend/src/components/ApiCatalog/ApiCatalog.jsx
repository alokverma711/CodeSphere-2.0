import { useState, useEffect, useMemo, useRef } from 'react';
import { 
    FaSearch, 
    FaFilter, 
    FaChevronRight, 
    FaInfoCircle, 
    FaFileCode, 
    FaCode, 
    FaTerminal, 
    FaClock, 
    FaAngleDoubleLeft, 
    FaAngleDoubleRight,
    FaCopy, 
    FaCheck, 
    FaRoute, 
    FaSlidersH,
    FaNetworkWired,
    FaTags,
    FaShieldAlt
} from 'react-icons/fa';
import './ApiCatalog.css';

// Pagination settings
const ITEMS_PER_PAGE = 7;

// Dynamic Metadata Helper to generate clean details based on paths, methods, and real backend data
function getEndpointMetadata(method, path, handlerFile, selectedEndpoint) {
    const cleanPath = path.toLowerCase();
    const cleanMethod = method.toUpperCase();
    
    // Parse resource name dynamically
    const segments = cleanPath.split('/').filter(Boolean);
    let resource = 'resource';
    if (segments.length > 0) {
        // If last segment is a parameter (e.g. :id or {id}), get the one before it
        const last = segments[segments.length - 1];
        if ((last.startsWith(':') || last.startsWith('{') || last.startsWith('<')) && segments.length > 1) {
            resource = segments[segments.length - 2];
        } else {
            resource = last;
        }
    }
    
    // Clean up resource name
    resource = resource.replace(/[^a-zA-Z0-9_-]/g, '');

    // 1. Dynamic Description
    let description = '';
    if (cleanMethod === 'GET') {
        description = cleanPath.includes(':') || cleanPath.includes('{')
            ? `Retrieve specific ${resource} instance by ID`
            : `Fetch and query lists of ${resource} records`;
    } else if (cleanMethod === 'POST') {
        description = `Submit payload to create and register a new ${resource} entity`;
    } else if (cleanMethod === 'PUT' || cleanMethod === 'PATCH') {
        description = `Update parameters of an existing ${resource} resource`;
    } else if (cleanMethod === 'DELETE') {
        description = `Permanently delete and purge the designated ${resource} record`;
    } else {
        description = `API endpoint handler for ${cleanMethod} requests to /${resource}`;
    }

    // 2. Controller & Handler
    const controller = selectedEndpoint?.handlerFile || handlerFile || 'N/A';
    const handler = selectedEndpoint?.handlerFunction || 'N/A';

    // 3. Middlewares
    const middleware = selectedEndpoint?.middleware || [];

    // 4. Tags
    let tags = [];
    if (segments.length > 0) {
        const first = segments[0] === 'api' && segments.length > 1 ? segments[1] : segments[0];
        tags = [first.charAt(0).toUpperCase() + first.slice(1)];
    } else {
        tags = ['API'];
    }

    // 5. Request example
    let requestExample = null;
    if (cleanMethod === 'POST' || cleanMethod === 'PUT' || cleanMethod === 'PATCH') {
        requestExample = {
            [resource]: `new_${resource}_data`,
            status: "active",
            payload: {}
        };
    }

    // 6. Response example
    const responseExample = {
        success: true,
        message: `Request for ${cleanMethod} ${path} processed successfully`,
        data: cleanMethod === 'GET' && !(cleanPath.includes(':') || cleanPath.includes('{')) 
            ? [{ id: "1", name: `Sample ${resource}` }]
            : { id: "1", name: `Sample ${resource}` }
    };

    return {
        description,
        controller,
        handler,
        middleware,
        tags,
        lastModified: 'Static Analysis',
        requestExample,
        responseExample
    };
}

// Search the hierarchical repo AST tree recursively to find file code node
function findNodeByPath(node, path) {
    if (!node) return null;
    const normNodePath = node.path?.replace(/^\/|\/$/g, '');
    const normPath = path?.replace(/^\/|\/$/g, '');
    
    if (normNodePath === normPath || node.id === path) return node;
    
    if (node.children) {
        for (let child of node.children) {
            const found = findNodeByPath(child, path);
            if (found) return found;
        }
    }
    return null;
}

export default function ApiCatalog({ apiEndpoints = [], repoTree = {} }) {
    // State management
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('ALL'); // 'ALL', 'GET', 'POST', 'PUT', 'DELETE'
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false); // Collapses Details Column
    const [currentPage, setCurrentPage] = useState(1);
    const [activeMobileTab, setActiveMobileTab] = useState('list'); // 'list' | 'details' | 'code'
    
    // Copy statuses
    const [copiedRequest, setCopiedRequest] = useState(false);
    const [copiedResponse, setCopiedResponse] = useState(false);
    const [copiedSource, setCopiedSource] = useState(false);
    
    // Refs for scrolling the code viewer
    const activeLineRef = useRef(null);
    const codeScrollContainerRef = useRef(null);

    // Compute dynamic stats metrics
    const stats = useMemo(() => {
        const result = { total: 0, get: 0, post: 0, put: 0, delete: 0 };
        apiEndpoints.forEach(ep => {
            result.total++;
            const method = ep.method.toUpperCase();
            if (method === 'GET') result.get++;
            else if (method === 'POST') result.post++;
            else if (method === 'PUT') result.put++;
            else if (method === 'DELETE') result.delete++;
        });
        return result;
    }, [apiEndpoints]);

    // Handle search + method tab filtering
    const filteredEndpoints = useMemo(() => {
        return apiEndpoints.filter(ep => {
            // Method filter
            if (selectedMethod !== 'ALL' && ep.method.toUpperCase() !== selectedMethod) {
                return false;
            }
            
            // Search text filter
            const query = searchQuery.toLowerCase();
            return (
                ep.path.toLowerCase().includes(query) ||
                ep.method.toLowerCase().includes(query) ||
                (ep.framework && ep.framework.toLowerCase().includes(query)) ||
                (ep.handlerFile && ep.handlerFile.toLowerCase().includes(query))
            );
        });
    }, [apiEndpoints, selectedMethod, searchQuery]);

    // Reset pagination page index when query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedMethod]);

    // Automatically select the first filtered endpoint if none is selected
    useEffect(() => {
        if (filteredEndpoints.length > 0) {
            // Check if current selected endpoint is in the filtered list
            const stillExists = filteredEndpoints.some(ep => ep.id === selectedEndpoint?.id);
            if (!stillExists) {
                setSelectedEndpoint(filteredEndpoints[0]);
            }
        } else {
            setSelectedEndpoint(null);
        }
    }, [filteredEndpoints, selectedEndpoint]);

    // Paginated endpoints computation
    const totalPages = Math.ceil(filteredEndpoints.length / ITEMS_PER_PAGE) || 1;
    const paginatedEndpoints = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEndpoints.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEndpoints, currentPage]);

    // Compute rich details dynamic block
    const endpointDetails = useMemo(() => {
        if (!selectedEndpoint) return null;
        return getEndpointMetadata(
            selectedEndpoint.method, 
            selectedEndpoint.path, 
            selectedEndpoint.handlerFile,
            selectedEndpoint
        );
    }, [selectedEndpoint]);

    // Find and read source code of the active endpoint from the repo AST tree
    const sourceCodeDetails = useMemo(() => {
        if (!selectedEndpoint || !repoTree) return null;
        
        const fileNode = findNodeByPath(repoTree, selectedEndpoint.handlerFile);
        if (fileNode && fileNode.code) {
            return {
                code: fileNode.code,
                language: fileNode.language || 'javascript',
                fileName: fileNode.name
            };
        }
        
        // Mock fallback if code is not retrieved
        return {
            code: `// File: ${selectedEndpoint.handlerFile}\n// Frame: ${selectedEndpoint.framework || 'Express'}\n\nconst express = require('express');\nconst router = express.Router();\nconst controller = require('../controllers/auth.controller');\n\n// ${selectedEndpoint.method} route registration\nrouter.${selectedEndpoint.method.toLowerCase()}('${selectedEndpoint.path}', \n    controller.${endpointDetails?.handler || 'handleRequest'}\n);\n\nmodule.exports = router;`,
            language: 'javascript',
            fileName: selectedEndpoint.handlerFile.split('/').pop()
        };
    }, [selectedEndpoint, repoTree, endpointDetails]);

    // Auto-scroll the live code viewer straight to the highlighted route definition
    useEffect(() => {
        if (activeLineRef.current) {
            // Delay slightly to allow layout and DOM binding to stabilize
            const timer = setTimeout(() => {
                activeLineRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [selectedEndpoint]);

    // Copy to clipboard actions
    const handleCopy = (text, setCopiedFlag) => {
        navigator.clipboard.writeText(text);
        setCopiedFlag(true);
        setTimeout(() => setCopiedFlag(false), 2000);
    };

    return (
        <div className="api-catalog-container">
            {/* 1. TOP METRIC STATS ROW */}
            <div className="api-stats-row">
                <div className="api-stat-card stat-card-total">
                    <div className="stat-info">
                        <span className="stat-label">Total Endpoints</span>
                        <span className="stat-count">{stats.total}</span>
                    </div>
                    <div className="stat-icon-wrapper">
                        <FaNetworkWired />
                    </div>
                </div>

                <div className="api-stat-card stat-card-get">
                    <div className="stat-info">
                        <span className="stat-label">GET</span>
                        <span className="stat-count">{stats.get}</span>
                    </div>
                    <div className="stat-icon-wrapper">GET</div>
                </div>

                <div className="api-stat-card stat-card-post">
                    <div className="stat-info">
                        <span className="stat-label">POST</span>
                        <span className="stat-count">{stats.post}</span>
                    </div>
                    <div className="stat-icon-wrapper">POST</div>
                </div>

                <div className="api-stat-card stat-card-put">
                    <div className="stat-info">
                        <span className="stat-label">PUT</span>
                        <span className="stat-count">{stats.put}</span>
                    </div>
                    <div className="stat-icon-wrapper">PUT</div>
                </div>

                <div className="api-stat-card stat-card-delete">
                    <div className="stat-info">
                        <span className="stat-label">DELETE</span>
                        <span className="stat-count">{stats.delete}</span>
                    </div>
                    <div className="stat-icon-wrapper">DEL</div>
                </div>
            </div>

            {/* MOBILE ONLY TAB NAVIGATION */}
            <div className="api-mobile-tabs">
                <button 
                    className={`api-mobile-tab-btn ${activeMobileTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveMobileTab('list')}
                >
                    <FaNetworkWired style={{ marginRight: 6 }} /> List
                </button>
                <button 
                    className={`api-mobile-tab-btn ${activeMobileTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveMobileTab('details')}
                    disabled={!selectedEndpoint}
                >
                    <FaInfoCircle style={{ marginRight: 6 }} /> Details
                </button>
                <button 
                    className={`api-mobile-tab-btn ${activeMobileTab === 'code' ? 'active' : ''}`}
                    onClick={() => setActiveMobileTab('code')}
                    disabled={!selectedEndpoint}
                >
                    <FaCode style={{ marginRight: 6 }} /> Source Code
                </button>
            </div>

            {/* 2. THREE COLUMN BOTTOM GRID */}
            <div className="api-main-grid">
                
                {/* COLUMN 1: ENDPOINTS LIST VIEW */}
                <div className={`api-panel endpoints-list-panel ${activeMobileTab === 'list' ? 'mobile-active' : 'mobile-hide'}`}>
                    <div className="api-panel-header">
                        <h3 className="api-panel-title">
                            Endpoints <span className="count-bubble">{filteredEndpoints.length}</span>
                        </h3>
                    </div>
                    
                    {/* Search and Filters */}
                    <div className="search-filter-container">
                        <div className="search-input-wrapper">
                            <FaSearch className="search-icon-inside" />
                            <input 
                                type="text" 
                                className="search-box-input"
                                placeholder="Search endpoints..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="filter-btn-funnel" title="Filters">
                                <FaSlidersH />
                            </button>
                        </div>
                        
                        <div className="method-pills-row">
                            {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map(method => (
                                <button
                                    key={method}
                                    className={`method-pill-btn ${selectedMethod === method ? `active-${method.toLowerCase()}` : ''}`}
                                    onClick={() => setSelectedMethod(method)}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable list of items */}
                    <div className="endpoints-list-scroll">
                        {paginatedEndpoints.length > 0 ? (
                            paginatedEndpoints.map((ep) => {
                                const isSelected = selectedEndpoint?.id === ep.id;
                                const methodLower = ep.method.toLowerCase();
                                return (
                                    <div
                                        key={ep.id}
                                        className={`endpoint-item-card ${isSelected ? 'selected' : ''} ${methodLower}`}
                                        onClick={() => {
                                            setSelectedEndpoint(ep);
                                            // auto expand if collapsed when changing endpoints
                                            if (isCollapsed) setIsCollapsed(false);
                                            setActiveMobileTab('details');
                                        }}
                                    >
                                        <div className="endpoint-item-main">
                                            <span className={`method-tag-badge ${methodLower}`}>
                                                {ep.method}
                                            </span>
                                            <div className="endpoint-item-details">
                                                <span className="endpoint-item-path" title={ep.path}>
                                                    {ep.path}
                                                </span>
                                                <span className="endpoint-item-file" title={ep.handlerFile}>
                                                    {ep.handlerFile}
                                                </span>
                                            </div>
                                        </div>
                                        <FaChevronRight className="chevron-arrow" />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="details-empty-state">
                                <FaRoute className="empty-state-icon" />
                                <h4>No endpoints found</h4>
                                <p>Refine your search term or method filter selection</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination indicators */}
                    {totalPages > 1 && (
                        <div className="endpoints-list-pagination">
                            <button 
                                className="pagination-arrow-btn"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                <FaAngleDoubleLeft />
                            </button>
                            
                            <div className="pagination-pages-row">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`pagination-page-number ${currentPage === page ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button 
                                className="pagination-arrow-btn"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                <FaAngleDoubleRight />
                            </button>
                        </div>
                    )}
                </div>

                {/* COLUMN 2: ENDPOINT DETAILS VIEW */}
                <div className={`api-panel details-panel ${isCollapsed ? 'collapsed' : ''} ${activeMobileTab === 'details' ? 'mobile-active' : 'mobile-hide'}`}>
                    <div className="api-panel-header">
                        <h3 className="api-panel-title">Endpoint Details</h3>
                        <button 
                            className="collapse-link-btn"
                            onClick={() => setIsCollapsed(true)}
                            title="Collapse Details column"
                        >
                            <FaAngleDoubleLeft /> Collapse
                        </button>
                    </div>

                    {selectedEndpoint && endpointDetails ? (
                        <div className="api-panel-body">
                            {/* Route Path bar */}
                            <div className="detail-route-header">
                                <span className={`method-tag-badge ${selectedEndpoint.method.toLowerCase()}`}>
                                    {selectedEndpoint.method}
                                </span>
                                <span className="detail-route-path">{selectedEndpoint.path}</span>
                                <button 
                                    className="mobile-view-code-btn"
                                    onClick={() => setActiveMobileTab('code')}
                                >
                                    <FaCode /> View Code
                                </button>
                            </div>

                            {/* Details Grid */}
                            <div className="details-grid">
                                <span className="grid-label"><FaInfoCircle className="grid-label-icon" /> Description</span>
                                <span className="grid-value">{endpointDetails.description}</span>

                                <span className="grid-label"><FaFileCode className="grid-label-icon" /> Route File</span>
                                <span 
                                    className="grid-value monospace link" 
                                    title="Click to view source code"
                                    onClick={() => setActiveMobileTab('code')}
                                >
                                    {selectedEndpoint.handlerFile}
                                </span>

                                <span className="grid-label"><FaCode className="grid-label-icon" /> Handler</span>
                                <span className="grid-value monospace">{endpointDetails.handler}</span>

                                <span className="grid-label"><FaTerminal className="grid-label-icon" /> Controller</span>
                                <span 
                                    className="grid-value monospace link"
                                    title="Click to view source code"
                                    onClick={() => setActiveMobileTab('code')}
                                >
                                    {endpointDetails.controller}
                                </span>

                                <span className="grid-label"><FaShieldAlt className="grid-label-icon" /> Middleware</span>
                                <span className="grid-value monospace">
                                    {endpointDetails.middleware.join(', ')}
                                </span>

                                <span className="grid-label"><FaTags className="grid-label-icon" /> Tags</span>
                                <span className="grid-value">
                                    {endpointDetails.tags.map(tag => (
                                        <span key={tag} className="pill-badge tag-pill">{tag}</span>
                                    ))}
                                </span>

                                <span className="grid-label"><FaClock className="grid-label-icon" /> Last Modified</span>
                                <span className="grid-value">{endpointDetails.lastModified}</span>
                            </div>

                            {/* JSON PREVIEWS */}
                            {endpointDetails.requestExample && (
                                <div className="preview-panel-box">
                                    <div className="preview-panel-header">
                                        <div className="preview-panel-title">Request Example</div>
                                        <div className="preview-panel-actions">
                                            <span className="preview-format-select">JSON</span>
                                            <button 
                                                className="preview-copy-btn"
                                                onClick={() => handleCopy(JSON.stringify(endpointDetails.requestExample, null, 2), setCopiedRequest)}
                                            >
                                                {copiedRequest ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                                                {copiedRequest ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    <pre className="preview-code-block">
                                        {JSON.stringify(endpointDetails.requestExample, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="preview-panel-box">
                                <div className="preview-panel-header">
                                    <div className="preview-panel-title">Response Example (200)</div>
                                    <div className="preview-panel-actions">
                                        <span className="preview-format-select">JSON</span>
                                        <button 
                                            className="preview-copy-btn"
                                            onClick={() => handleCopy(JSON.stringify(endpointDetails.responseExample, null, 2), setCopiedResponse)}
                                        >
                                            {copiedResponse ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                                            {copiedResponse ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                <pre className="preview-code-block">
                                    {JSON.stringify(endpointDetails.responseExample, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="api-panel-body">
                            <div className="details-empty-state">
                                <FaInfoCircle className="empty-state-icon" />
                                <h4>No endpoint selected</h4>
                                <p>Select an endpoint from the left menu to read detailed schema definitions</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUMN 3: LIVE SOURCE CODE VIEWER */}
                <div className={`api-panel source-code-panel ${isCollapsed ? 'full-width' : ''} ${activeMobileTab === 'code' ? 'mobile-active' : 'mobile-hide'}`}>
                    <div className="api-panel-header">
                        <h3 className="api-panel-title">
                            Source Code {sourceCodeDetails ? `(${sourceCodeDetails.fileName})` : ''}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {selectedEndpoint && (
                                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                                    Line {selectedEndpoint.line || selectedEndpoint.handlerLine || 1}
                                </span>
                            )}
                            {isCollapsed && (
                                <button 
                                    className="expand-link-btn"
                                    onClick={() => setIsCollapsed(false)}
                                    title="Expand Details panel"
                                >
                                    <FaAngleDoubleRight /> Expand Details
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="source-viewer-box">
                        {sourceCodeDetails ? (
                            <>
                                <div className="source-viewer-header">
                                    <span className="source-viewer-lang">{sourceCodeDetails.language}</span>
                                    <button 
                                        className="preview-copy-btn"
                                        onClick={() => handleCopy(sourceCodeDetails.code, setCopiedSource)}
                                        style={{ color: '#94a3b8' }}
                                    >
                                        {copiedSource ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                                        {copiedSource ? 'Copied!' : 'Copy Code'}
                                    </button>
                                </div>
                                
                                <div className="source-viewer-scroll" ref={codeScrollContainerRef}>
                                    <table className="source-viewer-table">
                                        <tbody>
                                            {sourceCodeDetails.code.split('\n').map((lineText, idx) => {
                                                const currentLineNum = idx + 1;
                                                const targetLineNum = selectedEndpoint?.line || selectedEndpoint?.handlerLine || 1;
                                                // Highlight the target line where the endpoint handler is bound
                                                const isTargetLine = currentLineNum === targetLineNum;
                                                
                                                return (
                                                    <tr 
                                                        key={idx} 
                                                        className={`source-code-tr ${isTargetLine ? 'active-highlight' : ''}`}
                                                        ref={isTargetLine ? activeLineRef : null}
                                                    >
                                                        <td className="source-line-number">{currentLineNum}</td>
                                                        <td className="source-line-content">
                                                            <pre>{lineText || ' '}</pre>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="code-empty-state-dark">
                                <p>Select an endpoint to inspect corresponding source code declarations.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
