'use client';

import { useState, useEffect } from 'react';
import { DeveloperSubmission } from '@/types/evaluation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { FiDownload, FiX, FiCheck, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import Image from 'next/image';

interface EvaluationFormProps {
  submission: DeveloperSubmission;
  onClose: () => void;
  onUpdate?: (updatedSubmission: DeveloperSubmission) => void;
}

export default function EvaluationForm({ submission, onClose, onUpdate }: EvaluationFormProps) {
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  
  // Add these state variables for signed URLs
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
        toast.error('Failed to load files');
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
      
      console.error('URL format not recognized:', url);
      return null;
    } catch (error) {
      console.error('Error parsing storage URL:', error);
      return null;
    }
  }

  // Helper function for direct download
  const getDirectDownloadUrl = (url: string) => {
    const parsedUrl = parseStorageUrl(url);
    if (!parsedUrl) return null;
    
    return `/api/storage?action=download&bucket=${parsedUrl.bucket}&path=${encodeURIComponent(parsedUrl.path)}`;
  };

  // Update the handleSubmit function to update the UI immediately:
  const handleSubmit = async (decision: 'accepted' | 'rejected') => {
    try {
      setIsSubmitting(true);

      // Create updated submission object
      const updatedSubmission = {
        ...submission,
        feedback,
        status: decision,
        updated_at: new Date().toISOString()
      };

      // Update the submission in the database
      const { error } = await supabase
        .from('submissions')
        .update({
          feedback,
          status: decision,
          updated_at: updatedSubmission.updated_at
        })
        .eq('id', submission.id);

      if (error) {
        throw new Error(error.message);
      }

      // Show success message
      toast.success(`Candidate ${decision === 'accepted' ? 'accepted' : 'rejected'} successfully`);
      
      // Update the UI immediately by calling the onUpdate function
      onUpdate && onUpdate(updatedSubmission);
      
      // Close the form
      onClose();
    } catch (err) {
      console.error('Error updating submission:', err);
      toast.error('Failed to update submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-bold">Evaluate {submission.full_name}</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>
      </div>

      {/* Developer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-medium text-lg mb-3">Developer Info</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {submission.full_name}</p>
            <p><span className="font-medium">Email:</span> {submission.email}</p>
            <p><span className="font-medium">Phone:</span> {submission.phone}</p>
            <p><span className="font-medium">Location:</span> {submission.location}</p>
            <p><span className="font-medium">Hobbies:</span> {submission.hobbies}</p>
            <p><span className="font-medium">Status:</span> 
              <span className={`ml-1 ${
                submission.status === 'accepted' ? 'text-green-600' :
                submission.status === 'rejected' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1) || 'Pending'}
              </span>
            </p>
          </div>
        </div>
        
        <div>
          {/* Profile Picture */}
          <h3 className="font-medium text-lg mb-3">Profile Picture</h3>
          <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden mb-4">
            {isLoadingUrls ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={`${submission.full_name}'s profile picture`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No profile picture available
              </div>
            )}
          </div>
          
          {/* Source Code Download */}
          <h3 className="font-medium text-lg mb-2">Source Code</h3>
          {isLoadingUrls ? (
            <div className="flex items-center justify-center h-10">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : sourceCodeUrl ? (
            <div className="space-y-2">
              <a 
                href={sourceCodeUrl}
                download
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FiDownload className="mr-2" />
                Download Source Code
              </a>
              
             
            </div>
          ) : (
            <p className="text-gray-500">No source code uploaded</p>
          )}
        </div>
      </div>
      
      {/* Feedback Form */}
      <div className="mb-6">
        <label htmlFor="feedback" className="block font-medium mb-2">
          Feedback
        </label>
        <textarea
          id="feedback"
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Provide feedback to the candidate..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </div>
      
      {/* Decision Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <button
          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleSubmit('rejected')}
          disabled={isSubmitting}
        >
          <FiThumbsDown className="mr-2" />
          We Are Sorry
        </button>
        <button
          className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleSubmit('accepted')}
          disabled={isSubmitting}
        >
          <FiThumbsUp className="mr-2" />
          Welcome to the Team
        </button>
      </div>
    </div>
  );
}