import TreeItem from "./TreeItem";

function FileExplorer({nodes, onNodeClick}) {
    return (
        <div className="file-explorer">
            {nodes.map((node) => (
                <TreeItem key={node.name} item={node} onNodeClick={onNodeClick} />
            ))}
        </div>
    );
}
export default FileExplorer;