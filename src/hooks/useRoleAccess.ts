'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast'; // You'll need to install this package

export function useDeveloperAccess() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && (!user || profile?.role !== 'developer')) {
      toast.error('Access denied. Developer role required.');
      router.replace('/login');
    }
  }, [user, profile, isLoading, router]);
  
  return { isAuthorized: !!user && profile?.role === 'developer', isLoading };
}

export function useEvaluatorAccess() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && (!user || profile?.role !== 'evaluator')) {
      toast.error('Access denied. Evaluator role required.');
      router.replace('/login');
    }
  }, [user, profile, isLoading, router]);
  
  return { isAuthorized: !!user && profile?.role === 'evaluator', isLoading };
}