"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { hasSessionTimedOut, updateLastActivity } from '../utils/sessionUtils';
import { useAuth } from '../contexts/AuthContext';

export default function SessionTimeoutMonitor() {
  const router = useRouter();
  const { signOut, user } = useAuth();

  useEffect(() => {
    // Only monitor if there's a user logged in
    if (!user) return;
    
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateLastActivity();
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // Check for session timeout periodically
    const interval = setInterval(() => {
      if (hasSessionTimedOut()) {
        // Navigate first, then log out
        router.push('/login');
        
        setTimeout(async () => {
          await signOut();
          toast.error('Your session has expired. Please log in again.');
        }, 100);
      }
    }, 60000); // Check every minute
    
    // Initial activity timestamp
    updateLastActivity();
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [router, signOut, user]);
  
  return null; // This component doesn't render anything
}