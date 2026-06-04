function flattenTree(root) {
    const nodes = [];
    const edges = [];
    
    // Track global stats for the entire tree
    let totalFiles = 0;
    const globalLangCounts = {};
    const IGNORED_EXTENSIONS = ['json', 'md', 'txt', 'yml', 'yaml', 'env', 'lock', 'xml', 'csv', 'png', 'jpg', 'jpeg', 'svg', 'gif', 'map', 'gitignore', 'config', 'example'];
    
    const getLanguageName = (ext) => {
        const map = {
            'js': 'JavaScript', 'jsx': 'React', 'ts': 'TypeScript', 'tsx': 'React TS',
            'py': 'Python', 'c': 'C', 'cpp': 'C++', 'cs': 'C#', 'java': 'Java',
            'go': 'Go', 'rs': 'Rust', 'rb': 'Ruby', 'php': 'PHP', 'html': 'HTML', 'css': 'CSS'
        };
        return map[ext] || ext.toUpperCase();
    };

    const traverse = (node) => {
        // Base case: it's a file
        const isFolder = node.children && node.children.length > 0;
        
        let nodeFiles = 0;

        if (!isFolder) {
            nodeFiles = 1;
            totalFiles += 1;
            
            // Extract extension
            let ext = node.name.includes('.') ? node.name.split('.').pop().toLowerCase() : 'unknown';
            if (node.name.startsWith('.') && node.name.indexOf('.', 1) === -1) {
                ext = node.name.substring(1).toLowerCase();
            }

            if (!IGNORED_EXTENSIONS.includes(ext) && ext !== 'unknown') {
                globalLangCounts[ext] = (globalLangCounts[ext] || 0) + 1;
            }
        }

        const newNode = {
            id: node.path,
            type: isFolder ? 'folder' : 'file',
            data: {
                label: node.name,
                path: node.path,
            },
            position: { x: 0, y: 0 },
        };
        nodes.push(newNode);

        if (node.children) {
            node.children.forEach(child => {
                edges.push({
                    id: `${node.path}=>${child.path}`,
                    source: node.path,
                    target: child.path,
                });
                
                // Recurse into children
                const childStats = traverse(child);
                
                // Aggregate stats from children
                nodeFiles += childStats.nodeFiles;
            });
        }
        
        // Attach stats to original node
        node.fileCount = nodeFiles;
        
        // Attach stats to the flattened node data
        newNode.data.fileCount = nodeFiles;

        return { nodeFiles };
    };

    if (root) {
        traverse(root);
    }
    
    // Process language statistics into percentages
    const totalLangFiles = Object.values(globalLangCounts).reduce((a, b) => a + b, 0);
    const languages = Object.entries(globalLangCounts)
        .map(([ext, count]) => ({
            name: getLanguageName(ext),
            percentage: totalLangFiles > 0 ? Math.round((count / totalLangFiles) * 100) : 0,
            count
        }))
        .sort((a, b) => b.count - a.count); // sort by highest count
    
    return { 
        nodes, 
        edges, 
        totalFiles, 
        languages
    };
}

export default flattenTree;