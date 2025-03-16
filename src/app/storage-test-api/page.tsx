'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiFolder, FiFile, FiArrowLeft, FiDownload } from 'react-icons/fi';

export default function StorageTestApi() {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [signedUrl, setSignedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load buckets on page load
  useEffect(() => {
    async function fetchBuckets() {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/storage?action=listBuckets');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch buckets');
        }
        
        setBuckets(data.buckets || []);
      } catch (err: any) {
        console.error('Error fetching buckets:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBuckets();
  }, []);

  // Load files when bucket/path changes
  useEffect(() => {
    if (!selectedBucket) return;
    
    async function fetchFiles() {
      try {
        setLoading(true);
        setError('');
        setSelectedFile(null);
        setSignedUrl('');
        
        const encodedPath = encodeURIComponent(currentPath);
        const response = await fetch(`/api/storage?action=listFiles&bucket=${selectedBucket}&path=${encodedPath}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch files');
        }
        
        setFiles(data.files || []);
      } catch (err: any) {
        console.error('Error fetching files:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFiles();
  }, [selectedBucket, currentPath]);

  // Navigate to a folder
  const navigateToFolder = (folderName: string) => {
    setPathHistory([...pathHistory, currentPath]);
    
    // Build the new path
    const newPath = currentPath ? 
      `${currentPath}/${folderName}` : 
      folderName;
      
    setCurrentPath(newPath);
  };
  
  // Navigate back
  const navigateBack = () => {
    if (pathHistory.length === 0) {
      // If at root of a bucket, go back to bucket selection
      setSelectedBucket('');
      setCurrentPath('');
      setPathHistory([]);
    } else {
      const previousPath = pathHistory.pop() || '';
      setPathHistory([...pathHistory]);
      setCurrentPath(previousPath);
    }
  };

  // Get signed URL for a file
  const getFileUrl = async (file: any) => {
    try {
      setSelectedFile(file);
      setLoading(true);
      setError('');
      
      // Build full path including current directory
      const fullPath = currentPath ? 
        `${currentPath}/${file.name}` : 
        file.name;
      
      const response = await fetch(
        `/api/storage?action=getSignedUrl&bucket=${selectedBucket}&path=${encodeURIComponent(fullPath)}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get signed URL');
      }
      
      setSignedUrl(data.signedUrl || '');
    } catch (err: any) {
      console.error('Error getting signed URL:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download a file directly
  const downloadFile = (file: any) => {
    // Build full path including current directory
    const fullPath = currentPath ? 
      `${currentPath}/${file.name}` : 
      file.name;
    
    const downloadUrl = `/api/storage?action=download&bucket=${selectedBucket}&path=${encodeURIComponent(fullPath)}`;
    
    // Open the download URL in a new tab
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Supabase Storage Test (API)</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          Error: {error}
        </div>
      )}
      
      {/* Navigation breadcrumbs */}
      {selectedBucket && (
        <div className="flex items-center mb-4 text-sm">
          <button 
            onClick={navigateBack}
            className="flex items-center mr-2 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            <FiArrowLeft className="mr-1" /> Back
          </button>
          
          <span 
            className="font-medium px-2 py-1 bg-blue-100 rounded mr-2"
            title={selectedBucket}
          >
            {selectedBucket}
          </span>
          
          {currentPath && currentPath.split('/').map((folder, i, arr) => (
            <span key={i} className="flex items-center">
              {i > 0 && <span className="mx-1">/</span>}
              <span className="px-2 py-1 bg-gray-100 rounded" title={folder}>
                {folder}
              </span>
            </span>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">1. Select a Bucket</h2>
          {loading && !selectedBucket ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : buckets.length === 0 ? (
            <p className="text-gray-500">No buckets found</p>
          ) : (
            <ul className="space-y-2">
              {buckets.map((bucket) => (
                <li key={bucket.id}>
                  <button
                    onClick={() => {
                      setSelectedBucket(bucket.name);
                      setCurrentPath('');
                      setPathHistory([]);
                      setSelectedFile(null);
                      setSignedUrl('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded ${
                      selectedBucket === bucket.name
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {bucket.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">
            2. {selectedBucket ? 'Browse Files' : 'Select a Bucket First'}
          </h2>
          {!selectedBucket ? (
            <p className="text-gray-500">Select a bucket to browse files</p>
          ) : loading && files.length === 0 ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : files.length === 0 ? (
            <p className="text-gray-500">No files or folders found in this location</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {/* First show folders */}
              {files
                .filter(item => item.id === null) // Folders have id=null in Supabase
                .map((folder, index) => (
                  <li key={`folder-${index}`}>
                    <button
                      onClick={() => navigateToFolder(folder.name)}
                      className="w-full text-left px-3 py-2 rounded bg-yellow-50 hover:bg-yellow-100 flex items-center"
                    >
                      <FiFolder className="text-yellow-500 mr-2" />
                      {folder.name}/
                    </button>
                  </li>
                ))
              }
              
              {/* Then show files */}
              {files
                .filter(item => item.id !== null) // Files have an ID
                .map((file) => (
                  <li key={file.id}>
                    <button
                      onClick={() => getFileUrl(file)}
                      className={`w-full text-left px-3 py-2 rounded flex items-center ${
                        selectedFile?.id === file.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <FiFile className="mr-2" />
                      {file.name}
                    </button>
                  </li>
                ))
              }
            </ul>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">3. File Preview</h2>
          {!selectedFile ? (
            <p className="text-gray-500">Select a file to preview</p>
          ) : loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : !signedUrl ? (
            <div>
              <p className="text-gray-500 mb-4">Failed to get file URL</p>
              <button
                onClick={() => downloadFile(selectedFile)}
                className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
              >
                <FiDownload className="mr-2" />
                Try Direct Download
              </button>
            </div>
          ) : (
            <div>
              {/* Show image preview for image files */}
              {selectedFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="relative h-40 mb-4 bg-gray-100">
                  <Image
                    src={signedUrl}
                    alt="File preview"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <p className="mb-4">No preview available for this file type</p>
              )}
              
              <div className="flex flex-col space-y-2">
                <a
                  href={signedUrl}
                  download
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiDownload className="mr-2" />
                  Download File
                </a>
                
                <button
                  onClick={() => window.open(signedUrl, '_blank')}
                  className="inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center justify-center"
                >
                  Open File in New Tab
                </button>
              </div>
              
              <div className="mt-4 text-xs">
                <p className="font-medium mb-1">File details:</p>
                <p>Name: {selectedFile.name}</p>
                <p>Size: {Math.round(selectedFile.metadata?.size / 1024)} KB</p>
                <p>Type: {selectedFile.metadata?.mimetype || 'Unknown'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}