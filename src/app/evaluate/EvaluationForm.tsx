'use client';

import { useState, useEffect } from 'react';
import { DeveloperSubmission } from '@/types/evaluation';
import { toast } from 'react-hot-toast';
import { FiDownload, FiX, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface EvaluationFormProps {
  submission: DeveloperSubmission;
  onClose: () => void;
  onUpdate?: (updatedSubmission: DeveloperSubmission) => void;
}

export default function EvaluationForm({ submission, onClose, onUpdate }: EvaluationFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [sourceCodeUrl, setSourceCodeUrl] = useState<string | null>(null);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true);

  // Set feedback when submission changes
  useEffect(() => {
    setFeedback(submission?.feedback || '');
  }, [submission]);

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

  const handleSubmit = async (decision: 'accepted' | 'rejected') => {
    try {
      setIsSubmitting(true);

      // Check if either feedback or decision status has changed
      const feedbackChanged = feedback.trim() !== (submission.feedback || '').trim();
      const statusChanged = decision !== submission.status;
      
      // Only update if something has changed
      if (!feedbackChanged && !statusChanged) {
        toast.success('No changes detected');
        setIsSubmitting(false);
        onClose();
        return;
      }

      // Update the submission in the database
      const { error } = await supabase
        .from('submissions')
        .update({
          feedback: feedback.trim(),
          status: decision,
          updated_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to update: ${error.message}`);
      }

      // Create an updated submission object for UI updates
      const updatedSubmission = {
        ...submission,
        feedback: feedback.trim(),
        status: decision,
        updated_at: new Date().toISOString()
      };

      // Call Edge Function if either status OR feedback changed
      if (statusChanged || feedbackChanged) {
        try {
          const { data, error: fnError } = await supabase.functions.invoke(
            'send-notification-email',
            {
              body: {
                type: 'UPDATE',
                table: 'submissions',
                schema: 'public',
                record: updatedSubmission,
                old_record: {
                  status: submission.status,
                  feedback: submission.feedback
                },
                // Add flags to indicate what changed for email templating
                changes: {
                  feedbackChanged,
                  statusChanged
                }
              }
            }
          );
          
          if (fnError) {
            console.error('Edge function error:', fnError);
            toast.error('Candidate updated but email notification failed');
          } else {
            console.log('Edge function response:', data);
            
            // Show different notifications based on what changed
            if (statusChanged && feedbackChanged) {
              toast.success(`Candidate ${decision === 'accepted' ? 'accepted' : 'rejected'} with feedback and email sent`);
            } else if (statusChanged) {
              toast.success(`Candidate ${decision === 'accepted' ? 'accepted' : 'rejected'} and email sent`);
            } else {
              toast.success('Feedback updated and notification email sent');
            }
          }
        } catch (fnError) {
          console.error('Error invoking Edge Function:', fnError);
          toast.error('Candidate updated but email notification failed');
        }
      } else {
        toast.success('Submission updated successfully');
      }
      
      // Update the UI immediately
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
    <div className="bg-white rounded-lg shadow-xl w-full h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-semibold">Evaluate Application</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>
      </div>
      
      <div className="p-6">
        {/* Developer Information */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Developer Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{submission.full_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{submission.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{submission.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{submission.location || 'Not provided'}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Hobbies & Interests</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p>{submission.hobbies || 'Not provided'}</p>
          </div>
        </div>
        
        {/* Profile Picture and Source Code */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {submission.profile_picture && (
            <div>
              <h3 className="text-lg font-medium mb-2">Profile Picture</h3>
              <div className="bg-gray-50 rounded-lg p-4 h-48 relative">
                {isLoadingUrls ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : profileImageUrl ? (
                  <Image 
                    src={profileImageUrl} 
                    alt="Profile" 
                    fill
                    className="object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>Failed to load image</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {submission.source_code && (
            <div>
              <h3 className="text-lg font-medium mb-2">Source Code</h3>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex flex-col items-center justify-center">
                {isLoadingUrls ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                ) : sourceCodeUrl ? (
                  <a 
                    href={sourceCodeUrl}
                    download
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <FiDownload className="mr-2" />
                    Download Source Code
                  </a>
                ) : (
                  <p>Failed to generate download link</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Your Feedback</h3>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Provide feedback to the candidate..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        
        {/* Buttons are now stacked on mobile but side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end mt-6">
          <button
            className="btn btn-error py-3 text-base flex-1 items-center justify-center h-14"
            onClick={() => handleSubmit('rejected')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <>
                <FiThumbsDown className="mr-3 h-5 w-5" />
                We Are Sorry
              </>
            )}
          </button>
          <button
            className="btn btn-success py-3 text-base flex-1 items-center justify-center h-14"
            onClick={() => handleSubmit('accepted')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <>
                <FiThumbsUp className="mr-3 h-5 w-5" />
                Welcome to the Team
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}