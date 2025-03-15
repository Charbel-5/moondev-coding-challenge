'use client';

import { useState, useEffect } from 'react';
import { useDeveloperAccess } from '@/hooks/useRoleAccess';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import SubmitForm from './SubmitForm';
import SubmissionStatus from '@/components/SubmissionStatus';
import { SubmissionResponse } from '@/types/submission';
import { FiEdit } from 'react-icons/fi';

export default function SubmitPage() {
  const { isAuthorized, isLoading: authLoading } = useDeveloperAccess();
  const { user } = useAuth();
  const supabase = createClient();
  
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

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
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchSubmission();
    }
  }, [user, supabase]);

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Show loading state while checking authorization or loading data
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not authorized, the hook will redirect automatically
  if (!isAuthorized) {
    return null;
  }

  const handleSuccess = (updatedSubmission: SubmissionResponse) => {
    setSubmission(updatedSubmission);
    setIsEditing(false);
  };
  
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Developer Application</h1>
      
      {submission && !isEditing ? (
        <div className="mb-8">
          <div className="bg-white shadow-md rounded-lg p-6 mb-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Your Submission</h2>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-full flex items-center"
              >
                <FiEdit size={16} className="mr-1" />
                Edit
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Hobbies</p>
              <p>{submission.hobbies}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Profile Picture</p>
                {submission.profile_picture ? (
                  <div className="aspect-square w-40 h-40 rounded-lg overflow-hidden relative">
                    <img 
                      src={submission.profile_picture} 
                      alt="Profile" 
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-400">No profile picture</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Source Code</p>
                {submission.source_code ? (
                  <a 
                    href={submission.source_code} 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline"
                  >
                    Download source code
                  </a>
                ) : (
                  <p className="text-sm italic text-gray-400">No source code uploaded</p>
                )}
              </div>
            </div>
          </div>
          
          <SubmissionStatus submission={submission} />
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? 'Edit Your Submission' : 'Submit Your Application'}
          </h2>
          <SubmitForm 
            existingSubmission={isEditing && submission ? submission : undefined} 
            onSuccess={handleSuccess}
          />
        </div>
      )}
    </main>
  );
}