'use client';

import { useEffect, useState } from 'react';
import { DeveloperSubmission } from '@/types/evaluation';
import Image from 'next/image';

interface SubmissionCardProps {
  submission: DeveloperSubmission;
  isSelected: boolean;
  onClick: () => void;
}

export default function SubmissionCard({ submission, isSelected, onClick }: SubmissionCardProps) {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get signed URL for profile image through the API
  useEffect(() => {
    async function fetchSignedUrl() {
      if (!submission.profile_picture) {
        setIsLoading(false);
        return;
      }

      try {
        // Parse the URL to get bucket and path
        const parsed = parseStorageUrl(submission.profile_picture);
        if (!parsed) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `/api/storage?action=getSignedUrl&bucket=${parsed.bucket}&path=${encodeURIComponent(parsed.path)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setProfileImageUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error getting signed URL for profile picture:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSignedUrl();
  }, [submission.profile_picture]);

  // Format the submission date
  const submissionDate = new Date(submission.created_at).toLocaleDateString();
  
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

  // Determine status style
  const getStatusStyle = () => {
    switch (submission.status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 bg-white'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {/* Profile picture */}
        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt={`${submission.full_name}'s profile`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              N/A
            </div>
          )}
        </div>
        
        {/* Developer info */}
        <div className="flex-grow">
          <h3 className="font-medium text-gray-900">{submission.full_name}</h3>
          <p className="text-sm text-gray-500">{submissionDate}</p>
        </div>
        
        {/* Status badge */}
        <div className={`px-2 py-1 text-xs rounded-full ${getStatusStyle()}`}>
          {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1) || 'Pending'}
        </div>
      </div>
    </div>
  );
}