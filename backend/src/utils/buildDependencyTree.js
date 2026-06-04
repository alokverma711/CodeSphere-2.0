/**
 * Build Dependency Tree
 * Downloads and analyses a GitHub repository.
 *
 * Returns the 3-object JSON contract:
 * {
 *   tree:          { id, name, type, children: [...fileNodes with imports[] and functions[]] },
 *   apiEndpoints:  [ { id, method, path, handlerFile, handlerFunction, handlerFunctionId, framework, callChain[] } ],
 *   traceability:  { nodes[], edges[], sequences[] },
 *   metadata:      { totalFiles, totalFunctions, totalEndpoints, totalImports }
 * }
 */

const unzipper = require('unzipper');
const axios = require('axios');
const FunctionParser = require('../parsers/functionParser');
const EndpointParser = require('../parsers/endpointParser');
const LanguageDetector = require('../parsers/languageDetector');
const ImportDetector = require('../parsers/importDetector');
const {
  resolveCallGraph,
  buildTraceabilityGraph,
  buildSequences,
  resolveEndpointCallChains
} = require('../engines/traceabilityEngine');

// Only use the token if it looks like a real PAT (not empty or placeholder)
function getAuthHeaders() {
  const token = process.env.GITHUB_TOKEN || '';
  if (!token || token.startsWith('your_') || token.length < 20) {
    return { 'User-Agent': 'CodeSphere_2_0' };
  }
  return { 'User-Agent': 'CodeSphere_2_0', Authorization: `token ${token}` };
}

// ---------------------------------------------------------------------------
// GitHub helpers
// ---------------------------------------------------------------------------
async function getDefaultBranch(username, repo) {
  try {
    const res = await axios.get(`https://api.github.com/repos/${username}/${repo}`, {
      headers: getAuthHeaders()
    });
    return res.data.default_branch || 'main';
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404) throw new Error(`Repository "${username}/${repo}" not found. Check the username and repo name.`);
    if (status === 403 || status === 429) {
      const reset = err?.response?.headers?.['x-ratelimit-reset'];
      const t = reset ? new Date(reset * 1000).toLocaleTimeString() : 'soon';
      throw new Error(`GitHub API rate limit exceeded. Resets at ${t}. Add a GITHUB_TOKEN to your .env file to increase limits.`);
    }
    if (status === 401) throw new Error(`GitHub authentication failed. Check your GITHUB_TOKEN in .env.`);
    console.warn('Branch fetch failed, defaulting to "main"');
    return 'main';
  }
}

async function getBranchHeadCommitSha(username, repo, branch) {
  try {
    const res = await axios.get(`https://api.github.com/repos/${username}/${repo}/commits/${encodeURIComponent(branch)}`, {
      headers: getAuthHeaders()
    });
    return res?.data?.sha || null;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404) return null;
    if (status === 403 || status === 429 || status === 401) return null;
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
async function BuildDependencyTree(username, repo, branchParam) {
  const branch = branchParam || await getDefaultBranch(username, repo);
  const commitHash = await getBranchHeadCommitSha(username, repo, branch);
  const zipUrl = `https://github.com/${username}/${repo}/zipball/${branch}/`;

  let response;
  try {
    response = await axios({
      method: 'get',
      url: zipUrl,
      responseType: 'stream',
      maxRedirects: 5,
      headers: getAuthHeaders()
    });
  } catch (err) {
    const s = err?.response?.status;
    if (s === 404) throw new Error(`Could not download "${repo}" (branch: ${branch}).`);
    if (s === 403 || s === 429) throw new Error('GitHub rate limit exceeded. Add GITHUB_TOKEN to .env.');
    throw new Error(`Failed to fetch repository: ${err.message}`);
  }

  const allFunctions = [];   // FunctionNode instances
  const allEndpoints = [];   // EndpointNode instances
  const fileMap = new Map(); // filePath → { language, role, imports[], functions[], code }
  const parsePromises = [];
  const frameworks = new Set();
  let totalImports = 0;
  let readmeExcerpt = '';

  await new Promise((resolve, reject) => {
    response.data
      .pipe(unzipper.Parse())
      .on('entry', entry => {
        const segments = entry.path.split('/');
        segments.shift(); // remove leading zip folder prefix
        if (segments.length === 0 || segments[0] === '') { entry.autodrain(); return; }

        const fullPath = segments.join('/');
        const isFile = !entry.type.includes('Directory');
        const fileName = segments[segments.length - 1] || '';
        const isReadme = /^readme(\..*)?$/i.test(fileName);

        if (!isFile) { entry.autodrain(); return; }

        const language = LanguageDetector.detectLanguage(entry.path);
        if (language === 'unknown' && !isReadme) { entry.autodrain(); return; }

        let code = '';
        entry.on('data', chunk => { code += chunk.toString(); });

        const p = new Promise(resolveFile => {
          entry.on('end', async () => {
            try {
              if (isReadme && !readmeExcerpt.trim()) {
                readmeExcerpt = code.slice(0, 12000);
              }

              if (language === 'unknown') {
                resolveFile();
                return;
              }

              // --- Imports ---
              const imports = ImportDetector.detectImports(code, language);
              totalImports += imports.length;

              // --- File role ---
              const role = ImportDetector.detectFileRole(fullPath, code);

              // --- Functions ---
              const fileFunctions = await FunctionParser.parseFunctions(code, language, fullPath);
              fileFunctions.forEach(f => {
                f.id = `${fullPath}#${f.name}`;
                f.file = fullPath;
                f.language = language;
              });
              allFunctions.push(...fileFunctions);

              // --- Endpoints ---
              const fileEndpoints = await EndpointParser.parseEndpoints(code, language, fullPath);
              fileEndpoints.forEach(ep => {
                ep.id = `${ep.method}:${ep.path}`;
                ep.handlerFile = fullPath;
              });
              allEndpoints.push(...fileEndpoints);

              // Track frameworks
              fileEndpoints.forEach(ep => { if (ep.framework) frameworks.add(ep.framework); });

              fileMap.set(fullPath, {
                language,
                role,
                imports,           // rich import objects
                code,
                functions: fileFunctions  // FunctionNode instances (not yet toJSON'd)
              });
            } catch (e) {
              console.warn(`Error parsing ${fullPath}:`, e.message);
            }
            resolveFile();
          });
        });
        parsePromises.push(p);
      })
      .on('finish', () => resolve())
      .on('error', err => reject(new Error(`Zip parse error: ${err.message}`)));
  });

  await Promise.all(parsePromises);

  // ---------------------------------------------------------------------------
  // Post-processing pipeline
  // ---------------------------------------------------------------------------

  // 1. Resolve call graph (populate func.calls / func.calledBy)
  resolveCallGraph(allFunctions, fileMap);

  // 2. Resolve handler function IDs for all endpoints
  allEndpoints.forEach(ep => {
    if (ep.handlerFunctionId) return; // already resolved (named function)

    const fileFuncs = allFunctions.filter(f => f.file === ep.handlerFile);

    // Strategy A: Match the __route_METHOD_LINE synthetic function (inline arrow handlers)
    const routeHandlerName = `__route_${ep.method.toLowerCase()}_${ep.handlerLine}`;
    const exactRouteMatch = fileFuncs.find(f => f.name === routeHandlerName);
    if (exactRouteMatch) {
      ep.handlerFunctionId = exactRouteMatch.id;
      return;
    }

    // Strategy B: Any route handler within 3 lines of handlerLine
    const nearbyRoute = fileFuncs
      .filter(f => f.type === 'route_handler' && Math.abs(f.line - ep.handlerLine) <= 3)
      .sort((a, b) => Math.abs(a.line - ep.handlerLine) - Math.abs(b.line - ep.handlerLine))[0];
    if (nearbyRoute) {
      ep.handlerFunctionId = nearbyRoute.id;
      return;
    }

    // Strategy C: Named function referenced by endpoint
    if (ep.handlerFunction && !ep.handlerFunction.startsWith('anonymous') && !ep.handlerFunction.includes('By')) {
      let named = fileFuncs.find(f => f.name === ep.handlerFunction);
      if (!named) {
        named = allFunctions.find(f => f.name === ep.handlerFunction);
      }
      if (named) { ep.handlerFunctionId = named.id; return; }
    }

    // Strategy D: Closest function in the same file by line number
    let closest = null, minDist = Infinity;
    fileFuncs.forEach(f => {
      const dist = Math.abs(f.line - (ep.handlerLine || 0));
      if (dist < minDist) { minDist = dist; closest = f; }
    });
    if (closest && minDist <= 10) ep.handlerFunctionId = closest.id;
  });

  // Post-resolve: update handlerFunction if a real (non-synthetic) function is linked
  allEndpoints.forEach(ep => {
    if (ep.handlerFunctionId) {
      const parts = ep.handlerFunctionId.split('#');
      const funcName = parts[parts.length - 1];
      if (funcName && !funcName.startsWith('__route_')) {
        ep.handlerFunction = funcName;
      }
    }
  });

  // Deduplicate endpoints by id (same path+method can appear in multiple route files)
  const epMap = new Map();
  allEndpoints.forEach(ep => {
    const key = ep.id;
    if (!epMap.has(key)) {
      epMap.set(key, ep);
    }
    // Keep only one (first seen wins)
  });
  const deduplicatedEndpoints = [...epMap.values()];

  // 3. Build endpoint call chains
  resolveEndpointCallChains(deduplicatedEndpoints, allFunctions);

  // 4. Build traceability graph nodes + edges
  const { nodes: traceNodes, edges: traceEdges } = buildTraceabilityGraph(allFunctions, fileMap, deduplicatedEndpoints);

  // 5. Build sequences (one per endpoint)
  const sequences = buildSequences(deduplicatedEndpoints, allFunctions, fileMap);


  // 6. Build file tree
  const tree = {
    id: 'root',
    name: repo,
    type: 'folder',
    path: '/',
    children: []
  };
  fileMap.forEach((info, filePath) => {
    _insertFileNode(tree, filePath, info);
  });

  // ---------------------------------------------------------------------------
  // Final response shape
  // ---------------------------------------------------------------------------
  return {
    tree,
    apiEndpoints: deduplicatedEndpoints.map(ep => ep.toJSON()),
    traceability: {
      nodes: traceNodes,
      edges: traceEdges,
      sequences
    },
    metadata: {
      totalFiles: fileMap.size,
      totalFunctions: allFunctions.filter(f => !f.name.startsWith('__route_')).length,
      totalEndpoints: deduplicatedEndpoints.length,
      totalImports,
      frameworks: [...frameworks],
      repository: { name: repo, branch, commitHash },
      readmeExcerpt
    }
  };
}

// ---------------------------------------------------------------------------
// Tree building helpers
// ---------------------------------------------------------------------------
function _insertFileNode(tree, filePath, info) {
  const segments = filePath.split('/');
  let current = tree;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;
    const isLast = i === segments.length - 1;
    const subPath = segments.slice(0, i + 1).join('/');

    let child = current.children.find(c => c.name === seg);
    if (!child) {
      if (isLast) {
        // File node
        child = {
          id: subPath,
          name: seg,
          type: 'file',
          path: subPath,
          language: info.language,
          role: info.role,
          code: info.code,
          // Rich imports: [{ name, path, isExternal, line }]
          imports: info.imports,
          // Serialized function summaries
          functions: info.functions.map(f => f.toJSON())
        };
      } else {
        // Folder node
        child = {
          id: subPath,
          name: seg,
          type: 'folder',
          path: subPath,
          children: []
        };
      }
      current.children.push(child);
    }

    if (!isLast) {
      if (!child.children) child.children = [];
      current = child;
    }
  }
}

module.exports = { BuildDependencyTree };