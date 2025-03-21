'use client';

import { useState, useEffect } from 'react';
import { SubmissionResponse } from '@/types/submission';
import Image from 'next/image';
import { FiCheckCircle, FiClock, FiThumbsUp, FiThumbsDown, FiDownload } from 'react-icons/fi';

interface SubmissionStatusProps {
  submission: SubmissionResponse;
}

export default function SubmissionStatus({ submission }: SubmissionStatusProps) {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [sourceCodeUrl, setSourceCodeUrl] = useState<string | null>(null);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true);

  // Get signed URLs when component mounts using the API route
  useEffect(() => {
    async function fetchUrls() {
      setIsLoadingUrls(true);
      
      try {
        // Get profile picture URL
        if (submission.profile_picture) {
          // Extract bucket and path from URL
          const parsedUrl = parseStorageUrl(submission.profile_picture);
          if (parsedUrl) {
            const response = await fetch(
              `/api/storage?action=getSignedUrl&bucket=${parsedUrl.bucket}&path=${encodeURIComponent(parsedUrl.path)}`
            );
            
            if (response.ok) {
              const data = await response.json();
              setProfileImageUrl(data.signedUrl);
            } else {
              console.error('Failed to fetch profile picture URL');
            }
          }
        }
        
        // Get source code URL
        if (submission.source_code) {
          // Extract bucket and path from URL
          const parsedUrl = parseStorageUrl(submission.source_code);
          if (parsedUrl) {
            const response = await fetch(
              `/api/storage?action=getSignedUrl&bucket=${parsedUrl.bucket}&path=${encodeURIComponent(parsedUrl.path)}`
            );
            
            if (response.ok) {
              const data = await response.json();
              setSourceCodeUrl(data.signedUrl);
            } else {
              console.error('Failed to fetch source code URL');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching signed URLs:', error);
      } finally {
        setIsLoadingUrls(false);
      }
    }
    
    fetchUrls();
  }, [submission]);

  // Parse Supabase storage URLs to extract bucket and path
  function parseStorageUrl(url: string): { bucket: string, path: string } | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Find the index of 'public' in the path
      const publicIndex = pathParts.indexOf('public');
      
      if (publicIndex !== -1 && publicIndex + 1 < pathParts.length) {
        return {
          bucket: pathParts[publicIndex + 1],
          path: pathParts.slice(publicIndex + 2).join('/')
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing storage URL:', error);
      return null;
    }
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">      
      {/* Display feedback & status if available */}
      <div>
        <h1 className="text-lg font-semibold mb-4">Evaluation Status</h1>
        
        <div className={`p-4 rounded-md ${
          submission.status === 'accepted' ? 'bg-green-50' :
          submission.status === 'rejected' ? 'bg-red-50' :
          'bg-gray-50'
        }`}>
          <div className="flex items-center mb-3">
            <span className={`inline-block rounded-full w-3 h-3 mr-2 ${
              submission.status === 'accepted' ? 'bg-green-500' :
              submission.status === 'rejected' ? 'bg-red-500' :
              'bg-yellow-500'
            }`}></span>
            <span className="font-medium">
              {submission.status === 'accepted' ? 'Accepted' :
               submission.status === 'rejected' ? 'Rejected' :
               'Pending Review'}
            </span>
          </div>
          
          {submission.feedback ? (
            <div>
              <p className="text-sm text-gray-700 font-medium mb-1">Feedback:</p>
              <p className="text-sm text-gray-600">{submission.feedback}</p>
            </div>
          ) : (
            submission.status === 'pending' && (
              <p className="text-sm text-gray-500 italic">Your submission is waiting for review.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}