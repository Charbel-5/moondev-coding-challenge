'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useEvaluatorAccess } from '@/hooks/useRoleAccess';
import { DeveloperSubmission } from '@/types/evaluation';
import EvaluationForm from './EvaluationForm';
import SubmissionCard from './SubmissionCard';
import { FiSearch } from 'react-icons/fi';

export default function EvaluatePage() {
  const { isAuthorized, isLoading: authLoading } = useEvaluatorAccess();
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<DeveloperSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<DeveloperSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch all submissions
  useEffect(() => {
    async function fetchSubmissions() {
      if (!isAuthorized) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching submissions:', error);
          return;
        }
        
        setSubmissions(data as DeveloperSubmission[]);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Only fetch if authorization is confirmed
    if (isAuthorized !== null && !authLoading) {
      fetchSubmissions();
    }
  }, [isAuthorized, authLoading, supabase]);
  
  // Listen for real-time updates
  useEffect(() => {
    if (!isAuthorized) return;
    
    const channel = supabase
      .channel('submission_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
        },
        async (payload) => {
          // Refresh all submissions to ensure we have the latest data
          const { data } = await supabase
            .from('submissions')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (data) {
            setSubmissions(data as DeveloperSubmission[]);
            
            // Update selected submission if needed
            if (selectedSubmission && payload.new && 'id' in payload.new && payload.new.id === selectedSubmission.id) {
              setSelectedSubmission(payload.new as DeveloperSubmission);
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthorized, supabase, selectedSubmission]);
  
  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(submission =>
    submission.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Show loading state
  if (authLoading || (isLoading && submissions.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If not authorized, the hook will redirect automatically
  if (!isAuthorized) {
    return null;
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Candidate Evaluations</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {filteredSubmissions.length === 0 ? (
              <p className="text-center py-6 text-gray-500">
                {isLoading ? 'Loading submissions...' : 'No submissions found'}
              </p>
            ) : (
              filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  isSelected={selectedSubmission?.id === submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                />
              ))
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <EvaluationForm 
              submission={selectedSubmission} 
              onClose={() => setSelectedSubmission(null)}
            />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center h-64 text-center">
              <p className="text-gray-500 mb-2">Select a candidate to evaluate</p>
              <p className="text-sm text-gray-400">Click on a submission from the list to view details and provide feedback</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}