import { useState } from 'react';
import { FileTree, FolderOpen, File, ChevronRight, ChevronDown } from 'lucide-react';

const FileTreeNode = ({ node, onFileSelect, selectedFile, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const handleClick = () => {
    if (node.is_directory) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-700 rounded ${
          selectedFile?.path === node.path ? 'bg-blue-600 hover:bg-blue-600' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.is_directory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            <FolderOpen className="w-4 h-4 flex-shrink-0 text-yellow-500" />
          </>
        ) : (
          <>
            <div className="w-4" />
            <File className="w-4 h-4 flex-shrink-0 text-gray-400" />
          </>
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {node.is_directory && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode
              key={`${child.path}-${index}`}
              node={child}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTreePanel = ({ title, fileTree, onFileSelect, selectedFile, onDirectoryChange }) => {
  const [directoryPath, setDirectoryPath] = useState('');
  const [error, setError] = useState('');

  const handleLoadDirectory = async () => {
    if (!directoryPath.trim()) {
      setError('Please enter a directory path');
      return;
    }

    setError('');
    try {
      const response = await fetch(
        `http://localhost:8000/api/files?directory=${encodeURIComponent(directoryPath)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to load directory');
      }

      const data = await response.json();
      onDirectoryChange(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FileTree className="w-5 h-5" />
          {title}
        </h2>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter directory path..."
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={directoryPath}
            onChange={(e) => setDirectoryPath(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLoadDirectory()}
          />
          <button
            onClick={handleLoadDirectory}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Load Directory
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {fileTree ? (
          <FileTreeNode node={fileTree} onFileSelect={onFileSelect} selectedFile={selectedFile} />
        ) : (
          <div className="p-4 text-gray-400 text-sm">No directory loaded</div>
        )}
      </div>
    </div>
  );
};

export default FileTreePanel;
