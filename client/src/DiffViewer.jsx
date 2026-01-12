import { useState, useEffect } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { AlertCircle } from 'lucide-react';

const DiffViewer = ({ file1, file2 }) => {
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (file1 && file2) {
      comparFiles();
    }
  }, [file1, file2]);

  const comparFiles = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file1_path: file1.path,
          file2_path: file2.path,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to compare files');
      }

      const data = await response.json();
      
      // Fetch file contents for the diff viewer
      const [content1Response, content2Response] = await Promise.all([
        fetch(`http://localhost:8000/api/file-content?file_path=${encodeURIComponent(file1.path)}`),
        fetch(`http://localhost:8000/api/file-content?file_path=${encodeURIComponent(file2.path)}`)
      ]);

      if (!content1Response.ok || !content2Response.ok) {
        throw new Error('Failed to fetch file contents');
      }

      const content1 = await content1Response.json();
      const content2 = await content2Response.json();

      setDiffData({
        file1: file1.path,
        file2: file2.path,
        content1: content1.content,
        content2: content2.content,
        diff: data.diff,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!file1 || !file2) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg">Select two files to compare</p>
          <p className="text-sm mt-2">Choose one file from each panel</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Comparing files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-red-400">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg font-semibold">Error</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex-1 text-sm">
          <div className="text-gray-400 mb-1">Left File:</div>
          <div className="text-white truncate">{diffData?.file1}</div>
        </div>
        <div className="flex-1 text-sm ml-4">
          <div className="text-gray-400 mb-1">Right File:</div>
          <div className="text-white truncate">{diffData?.file2}</div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {diffData && (
          <ReactDiffViewer
            oldValue={diffData.content1}
            newValue={diffData.content2}
            splitView={true}
            useDarkTheme={true}
            leftTitle={file1.name}
            rightTitle={file2.name}
            showDiffOnly={false}
            styles={{
              variables: {
                dark: {
                  diffViewerBackground: '#1a1b1e',
                  diffViewerColor: '#e0e0e0',
                  addedBackground: '#044B53',
                  addedColor: '#e0e0e0',
                  removedBackground: '#632F34',
                  removedColor: '#e0e0e0',
                  wordAddedBackground: '#055d67',
                  wordRemovedBackground: '#7d383f',
                  addedGutterBackground: '#034148',
                  removedGutterBackground: '#632b30',
                  gutterBackground: '#2c2c2c',
                  gutterBackgroundDark: '#262626',
                  highlightBackground: '#2a3f5f',
                  highlightGutterBackground: '#2d4566',
                },
              },
              line: {
                padding: '4px 2px',
              },
              contentText: {
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '13px',
              },
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DiffViewer;
