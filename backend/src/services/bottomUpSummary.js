const prisma = require('../lib/prisma');
const axios = require('axios');
const { generateSummary } = require('./summarise');

function collectTreeNodes(root) {
  const files = [];
  const folders = [];

  function walk(node, depth) {
    if (!node) return;

    const path = node.path || node.name || '';
    const isFolder = node.type === 'folder' || Array.isArray(node.children);

    if (isFolder) {
      folders.push({
        name: node.name || path || 'folder',
        path,
        depth,
        children: Array.isArray(node.children) ? node.children : []
      });
    } else {
      files.push({
        name: node.name || path || 'file',
        path,
        language: node.language || null,
        role: node.role || null,
        imports: Array.isArray(node.imports) ? node.imports : [],
        functions: Array.isArray(node.functions) ? node.functions : [],
        code: typeof node.code === 'string' ? node.code : ''
      });
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(child => walk(child, depth + 1));
    }
  }

  walk(root, 0);
  return { files, folders };
}

function trimText(text, maxChars) {
  if (!text || typeof text !== 'string') return '';
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n...` : text;
}

function getParentPath(nodePath) {
  if (!nodePath || nodePath === '/') return null;
  const normalized = nodePath.replace(/^\/|\/$/g, '');
  if (!normalized.includes('/')) return '/';
  return normalized.slice(0, normalized.lastIndexOf('/'));
}

function getGitHubAuthHeaders() {
  const token = process.env.GITHUB_TOKEN || '';
  if (!token || token.startsWith('your_') || token.length < 20) {
    return { 'User-Agent': 'CodeSphere_2_0' };
  }
  return { 'User-Agent': 'CodeSphere_2_0', Authorization: `token ${token}` };
}

async function getChangedFilePathsBetweenCommits(username, repo, baseSha, headSha) {
  if (!baseSha || !headSha) {
    return null;
  }

  if (baseSha === headSha) {
    return new Set();
  }

  const compareUrl = `https://api.github.com/repos/${username}/${repo}/compare/${baseSha}...${headSha}`;
  try {
    const res = await axios.get(compareUrl, {
      headers: getGitHubAuthHeaders(),
    });

    const files = Array.isArray(res?.data?.files) ? res.data.files : [];
    const changed = new Set();
    files.forEach(file => {
      if (file?.filename) changed.add(file.filename);
      if (file?.previous_filename) changed.add(file.previous_filename);
    });
    return changed;
  } catch (error) {
    return null;
  }
}

function buildFileContext(fileNode) {
  const importNames = fileNode.imports
    .map(item => (typeof item === 'string' ? item : item?.name || item?.path || item?.source || ''))
    .filter(Boolean)
    .slice(0, 50);

  const functionNames = fileNode.functions
    .map(fn => fn?.name)
    .filter(Boolean)
    .slice(0, 80);

  return [
    `File: ${fileNode.name}`,
    `Path: ${fileNode.path}`,
    `Language: ${fileNode.language || 'unknown'}`,
    `Role: ${fileNode.role || 'unknown'}`,
    `Imports (${importNames.length}): ${importNames.join(', ') || 'none'}`,
    `Functions (${functionNames.length}): ${functionNames.join(', ') || 'none'}`,
    '',
    'Code:',
    trimText(fileNode.code || 'Source code unavailable for this file.', 12000)
  ].join('\n');
}

function buildFolderContext(folderNode, directFileSummaries, childFolderSummaries) {
  const childPreview = folderNode.children
    .slice(0, 80)
    .map(child => `${child.type || 'node'}: ${child.name || child.path || 'unknown'}`)
    .join('\n');

  const fileSummaryPreview = directFileSummaries
    .slice(0, 40)
    .map(item => `Path: ${item.path}\nSummary:\n${trimText(item.summary, 1200)}`)
    .join('\n\n');

  const childFolderPreview = childFolderSummaries
    .slice(0, 40)
    .map(item => `Folder: ${item.path}\nSummary:\n${trimText(item.summary, 1200)}`)
    .join('\n\n');

  return [
    `Folder: ${folderNode.name}`,
    `Path: ${folderNode.path}`,
    `Direct Children: ${folderNode.children.length}`,
    childPreview ? `Child nodes:\n${childPreview}` : 'Child nodes: none',
    '',
    `Direct file summaries (${directFileSummaries.length}):`,
    fileSummaryPreview || 'No direct file summaries available.',
    '',
    `Direct child folder summaries (${childFolderSummaries.length}):`,
    childFolderPreview || 'No direct child folder summaries available.'
  ].join('\n');
}

function buildRepoContext({
  username,
  repo,
  branch,
  analysisResult,
  rootFolderSummary,
  topLevelFolderSummaries
}) {
  const metadata = analysisResult?.metadata || {};
  const folderPreview = topLevelFolderSummaries
    .slice(0, 30)
    .map(item => `Folder: ${item.path}\nSummary:\n${trimText(item.summary, 1800)}`)
    .join('\n\n');

  return [
    `Repository: ${username}/${repo}`,
    `Branch: ${branch || metadata?.repository?.branch || 'unknown'}`,
    `Total Files: ${metadata.totalFiles ?? 'Not specified in provided context.'}`,
    `Total Functions: ${metadata.totalFunctions ?? 'Not specified in provided context.'}`,
    `Total Imports: ${metadata.totalImports ?? 'Not specified in provided context.'}`,
    `Total API Endpoints: ${metadata.totalEndpoints ?? 'Not specified in provided context.'}`,
    `Frameworks: ${Array.isArray(metadata.frameworks) && metadata.frameworks.length ? metadata.frameworks.join(', ') : 'Not specified in provided context.'}`,
    '',
    'README excerpt:',
    trimText(metadata.readmeExcerpt || 'Not specified in provided context.', 5000),
    '',
    'Root folder summary:',
    rootFolderSummary ? trimText(rootFolderSummary.summary, 4000) : 'No root folder summary available.',
    '',
    `Top-level folder summaries (${topLevelFolderSummaries.length}):`,
    folderPreview || 'No top-level folder summaries available.'
  ].join('\n');
}

async function buildAndStoreBottomUpSummaries({ username, repo, branch, analysisResult }) {
  const effectiveBranch = branch || analysisResult?.metadata?.repository?.branch || 'main';
  const currentCommitHash = analysisResult?.metadata?.repository?.commitHash || null;
  const { files, folders } = collectTreeNodes(analysisResult.tree);

  const latestCompletedRun = await prisma.summaryRun.findFirst({
    where: {
      username,
      repo,
      branch: effectiveBranch,
      status: 'COMPLETED',
    },
    orderBy: {
      startedAt: 'desc',
    },
    include: {
      _count: {
        select: {
          fileSummaries: true,
          folderSummaries: true,
        },
      },
      repoSummary: true,
    },
  });

  if (latestCompletedRun && currentCommitHash && latestCompletedRun.commitHash === currentCommitHash) {
    return {
      runId: latestCompletedRun.id,
      username,
      repo,
      branch: effectiveBranch,
      commitHash: currentCommitHash,
      filesSummarized: latestCompletedRun._count.fileSummaries,
      foldersSummarized: latestCompletedRun._count.folderSummaries,
      status: latestCompletedRun.status,
      cacheHit: true,
      filesRegenerated: 0,
      filesReused: latestCompletedRun._count.fileSummaries,
    };
  }

  const changedPaths = latestCompletedRun
    ? await getChangedFilePathsBetweenCommits(username, repo, latestCompletedRun.commitHash, currentCommitHash)
    : null;

  const previousFileSummaries = latestCompletedRun
    ? await prisma.fileSummary.findMany({
      where: { runId: latestCompletedRun.id },
      select: {
        path: true,
        summary: true,
      },
    })
    : [];
  const previousSummaryByPath = new Map(previousFileSummaries.map(item => [item.path, item.summary]));

  const run = await prisma.summaryRun.create({
    data: {
      username,
      repo,
      branch: effectiveBranch,
      commitHash: currentCommitHash,
      status: 'IN_PROGRESS',
      metadata: analysisResult?.metadata || {}
    }
  });

  try {
    const fileSummaryRows = [];
    const fileSummariesByParent = new Map();
    let filesRegenerated = 0;
    let filesReused = 0;

    for (const fileNode of files) {
      const previousSummary = previousSummaryByPath.get(fileNode.path);
      const shouldReuse = Boolean(
        previousSummary &&
        changedPaths &&
        !changedPaths.has(fileNode.path)
      );

      let summaryText = '';
      if (shouldReuse) {
        summaryText = previousSummary;
        filesReused += 1;
      } else {
        const context = buildFileContext(fileNode);
        const result = await generateSummary(username, repo, 'file', fileNode.path, context);
        summaryText = result.summary;
        filesRegenerated += 1;
      }

      const row = await prisma.fileSummary.create({
        data: {
          runId: run.id,
          path: fileNode.path,
          name: fileNode.name,
          language: fileNode.language,
          role: fileNode.role,
          summary: summaryText
        }
      });
      fileSummaryRows.push(row);

      const parentPath = getParentPath(fileNode.path) || '/';
      if (!fileSummariesByParent.has(parentPath)) {
        fileSummariesByParent.set(parentPath, []);
      }
      fileSummariesByParent.get(parentPath).push(row);
    }

    const foldersBottomUp = folders
      .filter(folder => folder.path)
      .sort((a, b) => b.depth - a.depth);

    const folderSummaryRows = [];
    const folderSummariesByParent = new Map();
    for (const folderNode of foldersBottomUp) {
      const directFiles = fileSummariesByParent.get(folderNode.path) || [];
      const directChildFolderSummaries = folderSummariesByParent.get(folderNode.path) || [];
      const folderContext = buildFolderContext(folderNode, directFiles, directChildFolderSummaries);
      const result = await generateSummary(username, repo, 'folder', folderNode.path, folderContext);

      const row = await prisma.folderSummary.create({
        data: {
          runId: run.id,
          path: folderNode.path,
          name: folderNode.name,
          depth: folderNode.depth,
          fileCount: directFiles.length,
          summary: result.summary
        }
      });

      folderSummaryRows.push(row);

      const parentPath = getParentPath(folderNode.path);
      if (parentPath) {
        if (!folderSummariesByParent.has(parentPath)) {
          folderSummariesByParent.set(parentPath, []);
        }
        folderSummariesByParent.get(parentPath).push(row);
      }
    }

    const rootFolderSummary = folderSummaryRows.find(row => row.path === '/');
    const topLevelFolderSummaries = (folderSummariesByParent.get('/') || []).sort((a, b) => a.path.localeCompare(b.path));

    const repoContext = buildRepoContext({
      username,
      repo,
      branch: effectiveBranch,
      analysisResult,
      rootFolderSummary,
      topLevelFolderSummaries
    });
    const repoResult = await generateSummary(username, repo, 'repo', '/', repoContext);

    await prisma.repoSummary.create({
      data: {
        runId: run.id,
        summary: repoResult.summary
      }
    });

    await prisma.summaryRun.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    return {
      runId: run.id,
      username,
      repo,
      branch: effectiveBranch,
      commitHash: currentCommitHash,
      filesSummarized: fileSummaryRows.length,
      foldersSummarized: folderSummaryRows.length,
      status: 'COMPLETED',
      cacheHit: false,
      filesRegenerated,
      filesReused,
      changedFilesDetected: changedPaths ? changedPaths.size : null,
    };
  } catch (error) {
    await prisma.summaryRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error.message
      }
    });
    throw error;
  }
}

async function getLatestSummaryRun(username, repo, branch) {
  return prisma.summaryRun.findFirst({
    where: {
      username,
      repo,
      ...(branch ? { branch } : {}),
      status: 'COMPLETED'
    },
    orderBy: {
      startedAt: 'desc'
    },
    include: {
      repoSummary: true,
      _count: {
        select: {
          fileSummaries: true,
          folderSummaries: true
        }
      }
    }
  });
}

async function getSummaryRunDetails(runId) {
  const run = await prisma.summaryRun.findUnique({
    where: { id: runId },
    include: {
      repoSummary: true
    }
  });

  if (!run) return null;

  const [fileSummaries, folderSummaries] = await Promise.all([
    prisma.fileSummary.findMany({
      where: { runId },
      orderBy: { path: 'asc' }
    }),
    prisma.folderSummary.findMany({
      where: { runId },
      orderBy: [{ depth: 'desc' }, { path: 'asc' }]
    })
  ]);

  return {
    ...run,
    fileSummaries,
    folderSummaries
  };
}

module.exports = {
  buildAndStoreBottomUpSummaries,
  getLatestSummaryRun,
  getSummaryRunDetails
};
