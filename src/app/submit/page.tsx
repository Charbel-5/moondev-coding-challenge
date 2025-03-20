'use client';

import { useState, useEffect } from 'react';
import { useDeveloperAccess } from '@/hooks/useRoleAccess';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import SubmitForm from './SubmitForm';
import SubmissionStatus from '@/components/SubmissionStatus';
import { SubmissionResponse } from '@/types/submission';
import { FiEdit, FiDownload } from 'react-icons/fi';
import Image from 'next/image';
import toast from 'react-hot-toast';

const ProfileImage = ({ url, alt }: { url: string; alt: string }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        // Extract bucket and path from URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const publicIndex = pathParts.indexOf('public');
        
        if (publicIndex !== -1 && publicIndex + 1 < pathParts.length) {
          const bucket = pathParts[publicIndex + 1];
          const path = pathParts.slice(publicIndex + 2).join('/');
          
          const response = await fetch(
            `/api/storage?action=getSignedUrl&bucket=${bucket}&path=${encodeURIComponent(path)}`
          );
          
          if (response.ok) {
            const data = await response.json();
            setSignedUrl(data.signedUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching signed URL:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (url) {
      fetchSignedUrl();
    } else {
      setIsLoading(false);
    }
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return signedUrl ? (
    <Image 
      src={signedUrl} 
      alt={alt} 
      fill
      className="object-cover"
    />
  ) : (
    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
      Not available
    </div>
  );
};

// Helper function to parse Supabase storage URLs
function parseStorageUrl(url: string): { bucket: string, path: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
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

// Helper function to get direct download URL
function getDirectDownloadUrl(url: string): string {
  try {
    const parsed = parseStorageUrl(url);
    if (!parsed) return '#';
    
    return `/api/storage?action=download&bucket=${parsed.bucket}&path=${encodeURIComponent(parsed.path)}`;
  } catch (error) {
    console.error('Error creating direct download URL:', error);
    return '#';
  }
}

export default function SubmitPage() {
  const { isAuthorized, isLoading: authLoading } = useDeveloperAccess();
  const { user } = useAuth();
  const supabase = createClient();
  
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [sourceCodeUrl, setSourceCodeUrl] = useState<string | null>(null);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true);

  // Fetch existing submission if any
  useEffect(() => {
    async function fetchSubmission() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is the error code for "no rows returned"
          console.error('Error fetching submission:', error);
        }

        if (data) {
          setSubmission(data as SubmissionResponse);
          
          // Fetch signed URLs for files
          if (data.profile_picture) {
            fetchSignedUrl(data.profile_picture, 'profile');
          }
          
          if (data.source_code) {
            fetchSignedUrl(data.source_code, 'source');
          } else {
            setIsLoadingUrls(false);
          }
        } else {
          setIsLoadingUrls(false);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setIsLoadingUrls(false);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchSubmission();
    }
  }, [user, supabase]);

  // Function to fetch signed URL using our API
  async function fetchSignedUrl(url: string, type: 'profile' | 'source') {
    try {
      const parsed = parseStorageUrl(url);
      if (!parsed) {
        console.error('Failed to parse URL:', url);
        return;
      }
      
      const response = await fetch(
        `/api/storage?action=getSignedUrl&bucket=${parsed.bucket}&path=${encodeURIComponent(parsed.path)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (type === 'profile') {
          setProfileImageUrl(data.signedUrl);
        } else {
          setSourceCodeUrl(data.signedUrl);
        }
      } else {
        console.error('Failed to get signed URL', await response.text());
      }
    } catch (error) {
      console.error(`Error fetching signed URL for ${type}:`, error);
    } finally {
      setIsLoadingUrls(false);
    }
  }

  // Listen for real-time updates to submission
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('submissions_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setSubmission(payload.new as SubmissionResponse);
          
          // Fetch new URLs when submission updates
          if (payload.new.profile_picture) {
            fetchSignedUrl(payload.new.profile_picture, 'profile');
          }
          
          if (payload.new.source_code) {
            fetchSignedUrl(payload.new.source_code, 'source');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;
  
    // Set up real-time listener for submission updates
    const channel = supabase
      .channel('submission-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Update your local state with the new data
          setSubmission(payload.new as SubmissionResponse);
          
          // Show notifications based on status changes
          if (payload.old.status !== payload.new.status) {
            if (payload.new.status === 'accepted') {
              toast.success('Congratulations! Your application has been accepted!', {
                duration: 6000,
                icon: '🎉',
              });
            } else if (payload.new.status === 'rejected') {
              toast('Thank you for your interest. Your application was not selected.', {
                duration: 6000,
                icon: '📝',
              });
            }
          }
          
          // Show notification when feedback is updated
          if (payload.old.feedback !== payload.new.feedback && payload.new.feedback) {
            toast('New feedback has been received on your submission!', {
              icon: 'ℹ️',
              duration: 4000,
            });
          }
        }
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-md text-center">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Developer Submission</h1>

      {!submission || isEditing ? (
        <SubmitForm
          existingSubmission={submission || undefined}
          onSuccess={(submissionData) => {
            setSubmission(submissionData);
            setIsEditing(false);
            
            // Fetch new URLs after submission
            if (submissionData.profile_picture) {
              fetchSignedUrl(submissionData.profile_picture, 'profile');
            }
            
            if (submissionData.source_code) {
              fetchSignedUrl(submissionData.source_code, 'source');
            }
          }}
        />
      ) : (
        <div className="bg-white shadow-lg rounded-xl p-8">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-2xl font-semibold">Your Submission</h2>
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center text-primary px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
            >
              <FiEdit className="mr-2" /> Edit Submission
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="font-medium">{submission.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium">{submission.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="font-medium">{submission.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Location</p>
                <p className="font-medium">{submission.location}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">About You</h3>
            <div>
              <p className="text-sm text-gray-500 mb-1">Hobbies</p>
              <p className="text-gray-700 whitespace-pre-wrap">{submission.hobbies}</p>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Uploaded Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display profile picture */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Profile Picture</p>
                {isLoadingUrls ? (
                  <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : submission.profile_picture ? (
                  <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-3 h-48">
                    <div className="w-full h-full relative rounded-md overflow-hidden">
                      {profileImageUrl ? (
                        <Image 
                          src={profileImageUrl} 
                          alt="Profile" 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                          Failed to load image
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-sm italic text-gray-400">No profile picture</p>
                  </div>
                )}
              </div>
              
              {/* Display source code link */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Source Code</p>
                {isLoadingUrls ? (
                  <div className="flex items-center h-48 bg-gray-100 rounded-lg justify-center">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></div>
                      <span className="text-gray-400">Loading...</span>
                    </div>
                  </div>
                ) : submission.source_code ? (
                  <div className="h-48 bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <FiDownload className="text-primary" size={24} />
                    </div>
                    {sourceCodeUrl ? (
                      <a 
                        href={sourceCodeUrl} 
                        download
                        className="flex items-center px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        <FiDownload className="mr-2" />
                        Download Source Code
                      </a>
                    ) : (
                      <a 
                        href={getDirectDownloadUrl(submission.source_code)}
                        download
                        className="flex items-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <FiDownload className="mr-2" />
                        Direct Download
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-sm italic text-gray-400">No source code uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-medium mb-4 text-gray-800">Submission Status</h3>
            <SubmissionStatus submission={submission} />
          </div>
        </div>
      )}
    </div>
  );
}