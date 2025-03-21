'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Hook to check if user has developer role
export function useDeveloperAccess() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect during loading
    if (isLoading) return;
    
    // Skip redirection check if user is already on login page
    if (pathname === '/login') return;

    // Check if user is authenticated and has correct role
    if (!user) {
      router.push('/login');
    } else if (profile?.role !== 'developer') {
      // If the user is logging out (going to login page), don't show permission error
      if (!pathname?.includes('/login')) {
        toast.error('You do not have permission to access this page.');
      }
      router.push('/');
    }
  }, [user, profile, isLoading, router, pathname]);

  return { 
    isAuthorized: !!user && profile?.role === 'developer',
    isLoading 
  };
}

// Hook to check if user has evaluator role
export function useEvaluatorAccess() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect during loading
    if (isLoading) return;
    
    // Skip redirection check if user is already on login page
    if (pathname === '/login') return;

    // Check if user is authenticated and has correct role
    if (!user) {
      router.push('/login');
    } else if (profile?.role !== 'evaluator') {
      // If the user is logging out (going to login page), don't show permission error
      if (!pathname?.includes('/login')) {
        toast.error('You do not have permission to access this page.');
      }
      router.push('/');
    }
  }, [user, profile, isLoading, router, pathname]);

  return { 
    isAuthorized: !!user && profile?.role === 'evaluator',
    isLoading 
  };
}