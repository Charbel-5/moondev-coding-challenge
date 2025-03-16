'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Image from 'next/image';

export default function StorageTest() {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('No debug info yet');
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [fileUrl, setFileUrl] = useState('');

  // First, let's check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setDebugInfo(`Auth error: ${error.message}`);
        } else if (session) {
          setAuthInfo({
            loggedIn: true,
            user: session.user?.email,
            role: session.user?.user_metadata?.role || 'Unknown role'
          });
        } else {
          setAuthInfo({ loggedIn: false });
        }
      } catch (err: any) {
        setDebugInfo(`Auth check exception: ${err.message}`);
      }
    }
    
    checkAuth();
  }, []);

  // Then, try to fetch buckets
  useEffect(() => {
    async function fetchBuckets() {
      setLoading(true);
      try {
        console.log('Fetching buckets...');
        const { data, error } = await supabase.storage.listBuckets();
        
        console.log('Bucket response:', { data, error });
        
        if (error) {
          setDebugInfo(prevInfo => `${prevInfo}\nBuckets error: ${error.message}`);
        } else {
          setBuckets(data || []);
          setDebugInfo(prevInfo => `${prevInfo}\nFound ${data?.length || 0} buckets`);
        }
      } catch (err: any) {
        console.error('Buckets fetch exception:', err);
        setDebugInfo(prevInfo => `${prevInfo}\nBuckets exception: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBuckets();
  }, []);

  // Manually test specific known buckets
  async function testSpecificBuckets() {
    try {
      setDebugInfo(prevInfo => `${prevInfo}\nTesting specific buckets...`);
      
      // Try profile-pictures bucket
      const { data: profileData, error: profileError } = await supabase.storage
        .from('profile-pictures')
        .list();
        
      setDebugInfo(prevInfo => 
        `${prevInfo}\nprofile-pictures: ${profileError ? profileError.message : `${profileData?.length || 0} files found`}`
      );
      
      // Try source-code bucket
      const { data: sourceData, error: sourceError } = await supabase.storage
        .from('source-code')
        .list();
        
      setDebugInfo(prevInfo => 
        `${prevInfo}\nsource-code: ${sourceError ? sourceError.message : `${sourceData?.length || 0} files found`}`
      );
    } catch (err: any) {
      setDebugInfo(prevInfo => `${prevInfo}\nManual test exception: ${err.message}`);
    }
  }

  // Load files from selected bucket
  useEffect(() => {
    if (!selectedBucket) return;
    
    async function fetchFiles() {
      try {
        setDebugInfo(prevInfo => `${prevInfo}\nFetching files from ${selectedBucket}...`);
        const { data, error } = await supabase.storage
          .from(selectedBucket)
          .list();
          
        if (error) {
          setDebugInfo(prevInfo => `${prevInfo}\nFiles error: ${error.message}`);
        } else {
          setFiles(data || []);
          setDebugInfo(prevInfo => `${prevInfo}\nFound ${data?.length || 0} files in ${selectedBucket}`);
        }
      } catch (err: any) {
        setDebugInfo(prevInfo => `${prevInfo}\nFiles exception: ${err.message}`);
      }
    }
    
    fetchFiles();
  }, [selectedBucket]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Storage Test</h1>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-2">Authentication Status</h2>
        {authInfo ? (
          <div>
            <p>Logged in: {authInfo.loggedIn ? 'Yes' : 'No'}</p>
            {authInfo.loggedIn && (
              <>
                <p>User: {authInfo.user}</p>
                <p>Role: {authInfo.role}</p>
              </>
            )}
          </div>
        ) : (
          <p>Checking authentication...</p>
        )}
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-2">Debug Information</h2>
        <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap">{debugInfo}</pre>
        
        <div className="mt-4">
          <button 
            onClick={testSpecificBuckets}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Test Specific Buckets
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Buckets</h2>
          {loading ? (
            <p>Loading buckets...</p>
          ) : buckets.length === 0 ? (
            <p>No buckets found or access denied</p>
          ) : (
            <ul className="space-y-2">
              {buckets.map((bucket) => (
                <li key={bucket.id}>
                  <button
                    onClick={() => setSelectedBucket(bucket.name)}
                    className={`px-3 py-2 rounded w-full text-left ${
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
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Files</h2>
          {!selectedBucket ? (
            <p>Select a bucket to view files</p>
          ) : files.length === 0 ? (
            <p>No files found in this bucket or access denied</p>
          ) : (
            <ul className="space-y-2">
              {files.map((file) => (
                <li key={file.id}>
                  <button
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.storage
                          .from(selectedBucket)
                          .createSignedUrl(file.name, 60);
                          
                        if (error) {
                          setDebugInfo(prevInfo => `${prevInfo}\nURL error: ${error.message}`);
                        } else if (data) {
                          setFileUrl(data.signedUrl);
                        }
                      } catch (err: any) {
                        setDebugInfo(prevInfo => `${prevInfo}\nURL exception: ${err.message}`);
                      }
                    }}
                    className="px-3 py-2 rounded w-full text-left bg-gray-100 hover:bg-gray-200"
                  >
                    {file.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {fileUrl && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">File Preview</h2>
          <div className="mb-4">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded inline-block"
            >
              Open File
            </a>
          </div>
          
          {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <div className="relative h-48 bg-gray-100">
              <Image 
                src={fileUrl}
                alt="File preview"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <p>No preview available for this file type</p>
          )}
        </div>
      )}
    </div>
  );
}