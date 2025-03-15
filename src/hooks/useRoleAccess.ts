'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Hook to check if user has developer role
export function useDeveloperAccess() {
  const { user, isRole, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading) {
      if (!user) {
        toast.error('Please login to access this page');
        router.replace('/login');
      } else if (!isRole('developer')) {
        toast.error('Developers only: Access denied');
        router.replace('/evaluate'); // Redirect evaluators to their page
      }
    }
  }, [user, isRole, isLoading, router]);
  
  return { isAuthorized: !!user && isRole('developer'), isLoading };
}

// Hook to check if user has evaluator role
export function useEvaluatorAccess() {
  const { user, isRole, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading) {
      if (!user) {
        toast.error('Please login to access this page');
        router.replace('/login');
      } else if (!isRole('evaluator')) {
        toast.error('Evaluators only: Access denied');
        router.replace('/submit'); // Redirect developers to their page
      }
    }
  }, [user, isRole, isLoading, router]);
  
  return { isAuthorized: !!user && isRole('evaluator'), isLoading };
}