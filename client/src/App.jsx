import { useState } from 'react';
import './App.css';

function App() {
  const [leftDir, setLeftDir] = useState('');
  const [rightDir, setRightDir] = useState('');
  const [leftFiles, setLeftFiles] = useState(null);
  const [rightFiles, setRightFiles] = useState(null);
  const [leftSelectedFile, setLeftSelectedFile] = useState(null);
  const [rightSelectedFile, setRightSelectedFile] = useState(null);
  const [diffResult, setDiffResult] = useState(null);
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDirectory = async (path, side) => {
    try {
      const response = await fetch(`http://localhost:8000/api/files?directory=${encodeURIComponent(path)}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to load directory');
      }
      const data = await response.json();
      if (side === 'left') {
        setLeftFiles(data);
      } else {
        setRightFiles(data);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const selectFile = async (file, side) => {
    if (file.is_directory) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/file-content?file_path=${encodeURIComponent(file.path)}`);
      if (!response.ok) throw new Error('Failed to load file');
      const data = await response.json();
      
      if (side === 'left') {
        setLeftSelectedFile(file);
        setLeftContent(data.content);
      } else {
        setRightSelectedFile(file);
        setRightContent(data.content);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const compareFiles = async () => {
    if (!leftSelectedFile || !rightSelectedFile) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file1_path: leftSelectedFile.path,
          file2_path: rightSelectedFile.path,
        }),
      });
      if (!response.ok) throw new Error('Failed to compare');
      const data = await response.json();
      setDiffResult(data.diff);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFileTree = (node, side, level = 0) => {
    if (!node) return null;
    
    const isSelected = side === 'left' 
      ? leftSelectedFile?.path === node.path 
      : rightSelectedFile?.path === node.path;

    return (
      <div key={node.path}>
        <div
          onClick={() => node.is_directory ? null : selectFile(node, side)}
          style={{
            padding: '6px 8px',
            paddingLeft: `${level * 16 + 8}px`,
            cursor: node.is_directory ? 'default' : 'pointer',
            background: isSelected ? '#3b82f6' : 'transparent',
            color: isSelected ? 'white' : node.is_directory ? '#fbbf24' : '#e5e7eb',
            fontSize: '14px',
            borderRadius: '4px',
            margin: '2px 0',
          }}
        >
          {node.is_directory ? '📁 ' : '📄 '}{node.name}
        </div>
        {node.is_directory && node.children && node.children.map(child => renderFileTree(child, side, level + 1))}
      </div>
    );
  };

  const getDiffLineStyle = (type) => {
    switch (type) {
      case 'insert': return { background: '#166534', color: '#bbf7d0' };
      case 'delete': return { background: '#991b1b', color: '#fecaca' };
      case 'replace': return { background: '#1e40af', color: '#bfdbfe' };
      default: return { background: 'transparent', color: '#e5e7eb' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#111827', color: 'white' }}>
      {/* Header */}
      <header style={{ padding: '16px 24px', background: '#1f2937', borderBottom: '1px solid #374151' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>📊 File Compare</h1>
        <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '14px' }}>Compare files side-by-side with color-coded differences</p>
      </header>

      {error && (
        <div style={{ padding: '12px 24px', background: '#7f1d1d', color: '#fecaca' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel */}
        <div style={{ width: '280px', background: '#1f2937', borderRight: '1px solid #374151', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#9ca3af' }}>Left Directory</h3>
            <input
              type="text"
              placeholder="/path/to/directory"
              value={leftDir}
              onChange={(e) => setLeftDir(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: '#374151', border: '1px solid #4b5563', borderRadius: '6px', color: 'white', marginBottom: '8px', boxSizing: 'border-box' }}
            />
            <button
              onClick={() => loadDirectory(leftDir, 'left')}
              style={{ width: '100%', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
            >
              Load Directory
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
            {leftFiles && renderFileTree(leftFiles, 'left')}
          </div>
        </div>

        {/* Center - Diff View */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Compare Button */}
          <div style={{ padding: '12px', background: '#1f2937', borderBottom: '1px solid #374151', textAlign: 'center' }}>
            <button
              onClick={compareFiles}
              disabled={!leftSelectedFile || !rightSelectedFile || loading}
              style={{
                padding: '10px 24px',
                background: leftSelectedFile && rightSelectedFile ? '#10b981' : '#4b5563',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: leftSelectedFile && rightSelectedFile ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              {loading ? '⏳ Comparing...' : '🔍 Compare Selected Files'}
            </button>
            {leftSelectedFile && rightSelectedFile && (
              <p style={{ margin: '8px 0 0', color: '#9ca3af', fontSize: '13px' }}>
                {leftSelectedFile.name} ↔ {rightSelectedFile.name}
              </p>
            )}
          </div>

          {/* Diff Content */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
            {diffResult ? (
              <div style={{ flex: 1, display: 'flex' }}>
                {/* Left file content */}
                <div style={{ flex: 1, borderRight: '1px solid #374151', overflow: 'auto' }}>
                  <div style={{ padding: '8px 12px', background: '#1f2937', borderBottom: '1px solid #374151', fontWeight: 'bold', fontSize: '13px' }}>
                    {leftSelectedFile?.name}
                  </div>
                  <pre style={{ margin: 0, padding: '0', fontSize: '13px', fontFamily: 'monospace' }}>
                    {diffResult.map((line, i) => (
                      <div key={i} style={{ ...getDiffLineStyle(line.type), padding: '2px 12px', minHeight: '20px' }}>
                        <span style={{ color: '#6b7280', marginRight: '12px', display: 'inline-block', width: '40px', textAlign: 'right' }}>
                          {line.line_number_left || ''}
                        </span>
                        {line.content_left || ''}
                      </div>
                    ))}
                  </pre>
                </div>
                {/* Right file content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <div style={{ padding: '8px 12px', background: '#1f2937', borderBottom: '1px solid #374151', fontWeight: 'bold', fontSize: '13px' }}>
                    {rightSelectedFile?.name}
                  </div>
                  <pre style={{ margin: 0, padding: '0', fontSize: '13px', fontFamily: 'monospace' }}>
                    {diffResult.map((line, i) => (
                      <div key={i} style={{ ...getDiffLineStyle(line.type), padding: '2px 12px', minHeight: '20px' }}>
                        <span style={{ color: '#6b7280', marginRight: '12px', display: 'inline-block', width: '40px', textAlign: 'right' }}>
                          {line.line_number_right || ''}
                        </span>
                        {line.content_right || ''}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📂</p>
                  <p style={{ fontSize: '18px', margin: '0 0 8px' }}>Select files to compare</p>
                  <p style={{ fontSize: '14px' }}>Choose one file from each directory panel</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width: '280px', background: '#1f2937', borderLeft: '1px solid #374151', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#9ca3af' }}>Right Directory</h3>
            <input
              type="text"
              placeholder="/path/to/directory"
              value={rightDir}
              onChange={(e) => setRightDir(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: '#374151', border: '1px solid #4b5563', borderRadius: '6px', color: 'white', marginBottom: '8px', boxSizing: 'border-box' }}
            />
            <button
              onClick={() => loadDirectory(rightDir, 'right')}
              style={{ width: '100%', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
            >
              Load Directory
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
            {rightFiles && renderFileTree(rightFiles, 'right')}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: '12px 24px', background: '#1f2937', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9ca3af' }}>
        <span>
          {leftSelectedFile && rightSelectedFile 
            ? `✅ Ready to compare: ${leftSelectedFile.name} ↔ ${rightSelectedFile.name}`
            : 'Select files from both directories to compare'}
        </span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>🟢 Additions</span>
          <span>🔴 Deletions</span>
          <span>🔵 Changes</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

