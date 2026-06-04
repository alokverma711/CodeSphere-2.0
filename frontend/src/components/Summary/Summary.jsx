import { useState, useEffect, useMemo } from 'react';
import { FaCopy, FaFileAlt, FaCode, FaTerminal, FaCube } from 'react-icons/fa';
import './Summary.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function normalizeNodePath(pathValue, fallbackName = '') {
    const raw = typeof pathValue === 'string' && pathValue.trim()
        ? pathValue.trim()
        : fallbackName;
    if (!raw || raw === 'root') return '/';
    if (raw === '/') return '/';
    return raw.replace(/^\/+|\/+$/g, '');
}

function Summary({ selectedNode, username, repo, repoData, selectedBranch }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [storedSummaries, setStoredSummaries] = useState({
        repoSummary: null,
        fileByPath: {},
        folderByPath: {},
    });
    
    // Right sidebar local tabs: 'summary' or 'code'
    const [rightTab, setRightTab] = useState('summary');
    const [copied, setCopied] = useState(false);
    const normalizedImports = useMemo(() => (
        Array.isArray(selectedNode?.imports)
            ? selectedNode.imports
                .map(dep => (typeof dep === 'string' ? dep : dep?.name || dep?.path || dep?.source || ''))
                .filter(Boolean)
            : []
    ), [selectedNode?.imports]);
    const isRepoRootNode = useMemo(() => {
        if (!selectedNode || selectedNode.type !== 'folder') return false;
        const path = (selectedNode.path || '').trim();
        return path === '/' || selectedNode.id === 'root';
    }, [selectedNode]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchStoredSummaries = async () => {
            setStoredSummaries({
                repoSummary: null,
                fileByPath: {},
                folderByPath: {},
            });

            try {
                const branchQuery = selectedBranch ? `?branch=${encodeURIComponent(selectedBranch)}` : '';
                const fetchLatestRun = async () => {
                    const latestResponse = await fetch(`${API_BASE_URL}/summaries/latest/${username}/${repo}${branchQuery}`, {
                        signal: controller.signal
                    });

                    if (latestResponse.status === 404) {
                        return null;
                    }

                    if (!latestResponse.ok) {
                        return null;
                    }

                    return latestResponse.json();
                };

                let latestRun = await fetchLatestRun();
                if (!latestRun) {
                    const buildResponse = await fetch(`${API_BASE_URL}/summaries/build/${username}/${repo}`, {
                        method: 'POST',
                        signal: controller.signal,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            branch: selectedBranch || undefined,
                        }),
                    });

                    if (!buildResponse.ok) {
                        return;
                    }

                    latestRun = await fetchLatestRun();
                }

                if (!latestRun?.id) {
                    return;
                }

                const runResponse = await fetch(`${API_BASE_URL}/summaries/run/${latestRun.id}`, {
                    signal: controller.signal
                });
                if (!runResponse.ok) {
                    return;
                }

                const runData = await runResponse.json();
                const fileByPath = {};
                const folderByPath = {};

                (runData?.fileSummaries || []).forEach(item => {
                    const key = normalizeNodePath(item.path, item.name);
                    fileByPath[key] = item.summary;
                });

                (runData?.folderSummaries || []).forEach(item => {
                    const key = normalizeNodePath(item.path, item.name);
                    folderByPath[key] = item.summary;
                });

                setStoredSummaries({
                    repoSummary: runData?.repoSummary?.summary || null,
                    fileByPath,
                    folderByPath,
                });
            } catch (fetchErr) {
                if (fetchErr.name === 'AbortError') return;
            }
        };

        fetchStoredSummaries();

        return () => {
            controller.abort();
        };
    }, [username, repo, selectedBranch]);

    // Fetch summary when a node is selected
    useEffect(() => {
        if (!selectedNode) {
            setSummary(null);
            return;
        }

        const controller = new AbortController();

        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            setSummary(null);

            try {
                // Determine summary type based on node type
                const summaryType = isRepoRootNode
                    ? 'repo'
                    : selectedNode.type === 'folder'
                        ? 'folder'
                        : 'file';

                const normalizedTargetPath = normalizeNodePath(selectedNode.path, selectedNode.name);
                const storedSummaryText = summaryType === 'repo'
                    ? storedSummaries.repoSummary
                    : summaryType === 'folder'
                        ? storedSummaries.folderByPath[normalizedTargetPath]
                        : storedSummaries.fileByPath[normalizedTargetPath];

                if (storedSummaryText) {
                    setSummary({
                        summary: storedSummaryText,
                        summaryType,
                        targetPath: normalizedTargetPath,
                        repository: `${username}/${repo}`,
                        source: 'database',
                    });
                    return;
                }
                
                // Build richer node context for better AI summaries
                let fileContent = '';
                if (summaryType === 'repo') {
                    const metadata = repoData?.metadata || {};
                    const rootChildren = Array.isArray(repoData?.tree?.children)
                        ? repoData.tree.children
                        : Array.isArray(selectedNode.children)
                            ? selectedNode.children
                            : [];

                    const topFolders = rootChildren
                        .filter(child => child?.type === 'folder')
                        .map(child => child?.name)
                        .filter(Boolean);
                    const topFiles = rootChildren
                        .filter(child => child?.type === 'file')
                        .map(child => child?.name)
                        .filter(Boolean);

                    const endpointPreview = Array.isArray(repoData?.apiEndpoints)
                        ? repoData.apiEndpoints
                            .slice(0, 20)
                            .map(ep => `${ep.method || 'METHOD'} ${ep.path || '/'} -> ${ep.handlerFile || 'unknown handler file'}`)
                            .join('\n')
                        : '';

                    const readmeExcerpt = typeof metadata.readmeExcerpt === 'string' && metadata.readmeExcerpt.trim()
                        ? metadata.readmeExcerpt.slice(0, 5000)
                        : 'Not specified in provided context.';

                    fileContent = [
                        `Repository: ${username}/${repo}`,
                        `Branch: ${metadata?.repository?.branch || 'Not specified in provided context.'}`,
                        `Total Files: ${metadata.totalFiles ?? 'Not specified in provided context.'}`,
                        `Total Functions: ${metadata.totalFunctions ?? 'Not specified in provided context.'}`,
                        `Total Imports: ${metadata.totalImports ?? 'Not specified in provided context.'}`,
                        `Total API Endpoints: ${metadata.totalEndpoints ?? 'Not specified in provided context.'}`,
                        `Frameworks: ${Array.isArray(metadata.frameworks) && metadata.frameworks.length ? metadata.frameworks.join(', ') : 'Not specified in provided context.'}`,
                        '',
                        `Top-level folders (${topFolders.length}): ${topFolders.slice(0, 40).join(', ') || 'none'}`,
                        `Top-level files (${topFiles.length}): ${topFiles.slice(0, 40).join(', ') || 'none'}`,
                        '',
                        endpointPreview ? `Sample API routes:\n${endpointPreview}` : 'Sample API routes: Not specified in provided context.',
                        '',
                        'README excerpt:',
                        readmeExcerpt
                    ].join('\n');
                } else if (summaryType === 'file') {
                    const codeSnippet = selectedNode.code
                        ? selectedNode.code.slice(0, 12000)
                        : 'Source code unavailable for this file.';
                    const functionNames = (selectedNode.functions || []).map(fn => fn?.name).filter(Boolean).slice(0, 40);
                    fileContent = [
                        `File: ${selectedNode.name}`,
                        `Path: ${selectedNode.path || selectedNode.name}`,
                        `Language: ${selectedNode.language || 'unknown'}`,
                        `Role: ${selectedNode.role || 'unknown'}`,
                        `Imports (${normalizedImports.length}): ${normalizedImports.slice(0, 40).join(', ') || 'none'}`,
                        `Functions (${functionNames.length}): ${functionNames.join(', ') || 'none'}`,
                        '',
                        'Code:',
                        codeSnippet
                    ].join('\n');
                } else {
                    const children = Array.isArray(selectedNode.children) ? selectedNode.children : [];
                    const childPreview = children
                        .slice(0, 40)
                        .map(child => `${child.type || 'node'}: ${child.name || child.path || 'unknown'}`)
                        .join('\n');
                    fileContent = [
                        `Folder: ${selectedNode.name}`,
                        `Path: ${selectedNode.path || selectedNode.name}`,
                        `Direct Children: ${children.length}`,
                        childPreview ? `Child nodes:\n${childPreview}` : 'Child nodes: unavailable'
                    ].join('\n');
                }

                const response = await fetch(`${API_BASE_URL}/summarize`, {
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        repo: repo,
                        summaryType: summaryType,
                        targetPath: normalizedTargetPath,
                        fileContent: fileContent,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
                }

                const data = await response.json();
                if (!data?.summary || typeof data.summary !== 'string') {
                    throw new Error('Summary response is malformed.');
                }
                setSummary(data);
            } catch (err) {
                if (err.name === 'AbortError') return;
                setError(err.message);
                console.error('Summary fetch error:', err);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchSummary();
        
        // If an active function trace is passed, auto-select code tab
        setRightTab(selectedNode.highlightedFunction ? 'code' : 'summary');

        return () => {
            controller.abort();
        };
    }, [selectedNode, username, repo, repoData, isRepoRootNode, normalizedImports, storedSummaries]);

    const handleCopyCode = () => {
        if (!selectedNode || !selectedNode.code) return;
        navigator.clipboard.writeText(selectedNode.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Empty state when nothing is selected
    if (!selectedNode) {
        return (
            <div className="summary-container">
                <div className="summary-empty">
                    <FaTerminal className="empty-icon" size={24} />
                    <h4>Code Intelligence Workspace</h4>
                    <p>Select a node from the explorer, graph, tree, or API gateway to activate static code analyses.</p>
                </div>
            </div>
        );
    }

    // Identify start/end lines for active function traceability highlighting
    let startHighlight = 0;
    let endHighlight = 0;
    
    if (selectedNode.highlightedFunction && selectedNode.functions) {
        const activeFunc = selectedNode.functions.find(f => f.name === selectedNode.highlightedFunction);
        if (activeFunc) {
            startHighlight = activeFunc.startLine || activeFunc.line || 0;
            endHighlight = activeFunc.endLine || activeFunc.line || 0;
        }
    }

    return (
        <div className="summary-container">
            {/* Header with node info */}
            <div className="summary-header">
                <h3 className="node-title" title={selectedNode.name}>{selectedNode.name}</h3>
                <span className={`node-type-badge ${selectedNode.type === 'folder' ? 'folder' : 'file'}`}>
                    {selectedNode.type}
                </span>
            </div>

            {/* Tab switchers */}
            <div className="summary-tabs">
                <button 
                    className={`tab-btn-item ${rightTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setRightTab('summary')}
                >
                    <FaFileAlt style={{ marginRight: '6px' }} /> Summary
                </button>
                {selectedNode.type === 'file' && (
                    <button 
                        className={`tab-btn-item ${rightTab === 'code' ? 'active' : ''}`}
                        onClick={() => setRightTab('code')}
                    >
                        <FaCode style={{ marginRight: '6px' }} /> Source Code
                    </button>
                )}
            </div>

            {/* Render local Tab content */}
            <div className="summary-tab-content">
                {rightTab === 'summary' ? (
                    <div className="summary-info-tab">
                        {/* Loading state */}
                        {loading && (
                            <div className="summary-loading">
                                <div className="summary-spinner" />
                                <p>Generating AI summary...</p>
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="summary-error">
                                <p>⚠️ AI Summary Unavailable: {error}</p>
                            </div>
                        )}

                        {/* Summary text content */}
                        {summary && (
                            <div className="summary-text-block">
                                <p>{summary.summary}</p>
                            </div>
                        )}

                        {/* Node Properties Meta details */}
                        <div className="node-details-section">
                            <h4 className="meta-sec-title">Properties</h4>
                            
                            <div className="meta-sec-row">
                                <span>Path:</span>
                                <code className="meta-sec-path">{selectedNode.path || selectedNode.name}</code>
                            </div>
                            
                            {selectedNode.language && (
                                <div className="meta-sec-row">
                                    <span>Language:</span>
                                    <strong>{selectedNode.language}</strong>
                                </div>
                            )}

                            {selectedNode.role && (
                                <div className="meta-sec-row">
                                    <span>Architecture Role:</span>
                                    <span className="role-badge">{selectedNode.role}</span>
                                </div>
                            )}
                        </div>

                        {/* Render imports list */}
                        {normalizedImports.length > 0 && (
                            <div className="node-details-section">
                                <h4 className="meta-sec-title">Imports ({normalizedImports.length})</h4>
                                <div className="imports-badges-grid">
                                    {normalizedImports.map((dep, idx) => (
                                        <span key={idx} className="import-capsule">
                                            <FaCube size={8} style={{ marginRight: '4px', opacity: 0.7 }} /> {dep}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Render Functions list */}
                        {selectedNode.functions && selectedNode.functions.length > 0 && (
                            <div className="node-details-section">
                                <h4 className="meta-sec-title">Functions ({selectedNode.functions.length})</h4>
                                <div className="functions-monos-list">
                                    {selectedNode.functions.map((fn, idx) => (
                                        <div key={idx} className={`func-mono-item ${selectedNode.highlightedFunction === fn.name ? 'highlighted' : ''}`}>
                                            <code className="fn-name">{fn.name}</code>
                                            <span className="fn-params">
                                                ({fn.parameters ? fn.parameters.join(', ') : ''})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="code-view-tab">
                        {selectedNode.code ? (
                            <div className="code-viewer-container">
                                <div className="code-viewer-actions">
                                    <span className="code-viewer-lang">{selectedNode.language || 'code'}</span>
                                    <button onClick={handleCopyCode} className="copy-code-btn">
                                        <FaCopy size={10} style={{ marginRight: '4px' }} />
                                        {copied ? 'Copied!' : 'Copy Code'}
                                    </button>
                                </div>
                                <div className="code-viewer-scroll">
                                    <table className="code-viewer-table">
                                        <tbody>
                                            {selectedNode.code.split('\n').map((line, idx) => {
                                                const lineNum = idx + 1;
                                                const isHighlighted = startHighlight && endHighlight && lineNum >= startHighlight && lineNum <= endHighlight;
                                                return (
                                                    <tr key={idx} className={`code-tr ${isHighlighted ? 'active-highlight' : ''}`}>
                                                        <td className="code-line-number">{lineNum}</td>
                                                        <td className="code-line-content">
                                                            <pre>{line || ' '}</pre>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="code-empty-state">
                                <p>No raw source code content has been loaded for this file.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Summary;
