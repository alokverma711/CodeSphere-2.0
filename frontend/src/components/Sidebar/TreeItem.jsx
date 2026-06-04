import { useState } from "react";
import { FaFolder, FaFolderOpen, FaChevronRight } from "react-icons/fa";
import { resolveIcon } from "../../utils/icons";
import "./Sidebar.css";

function TreeItem({ item, onNodeClick }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Safety check: nodes from the backend have 'children' if they are folders
    const isFolder = item.children && item.children.length > 0;

    const { Icon, color } = resolveIcon(item.name);

    const handleItemClick = () => {
        onNodeClick?.({
            name: item.name,
            type: isFolder ? 'folder' : 'file',
            path: item.path || item.name,
            description: item.description || "",
            code: item.code || "",
            imports: item.imports || [],
            functions: item.functions || []
        });
    };

    return (
        <div className="tree-item">
            <div className="tree-item-header" onClick={() => {
                if (isFolder) {
                    setIsOpen(!isOpen);
                }
                handleItemClick();
            }}>
                {/* Toggle chevron (only visible for folders) */}
                <div className={`tree-item-toggle ${isOpen ? 'open' : ''}`}>
                    {isFolder && <FaChevronRight size={10} />}
                </div>
                
                {/* File/Folder Icon */}
                <div className="tree-item-icon">
                    {isFolder ? (
                        isOpen ? <FaFolderOpen color="#3b82f6" /> : <FaFolder color="#94a3b8" />
                    ) : (
                        <Icon color={color} />
                    )}
                </div>
                
                {/* Name */}
                <span className="tree-item-name" title={item.name}>{item.name}</span>
            </div>
            
            {/* Nested children */}
            {isFolder && isOpen && (
                <div className="tree-item-children">
                    {item.children.map((child) => (
                        <TreeItem key={child.path || child.name} item={child} onNodeClick={onNodeClick} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default TreeItem;