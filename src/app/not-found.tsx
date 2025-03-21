'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FiChevronLeft } from 'react-icons/fi';
import { useEffect, useState } from 'react';

export default function NotFoundPage() {
  const { user, profile, isLoading } = useAuth();
  const [redirect, setRedirect] = useState('/');
  
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setRedirect('/login');
      } else if (profile?.role === 'developer') {
        setRedirect('/submit');
      } else if (profile?.role === 'evaluator') {
        setRedirect('/evaluate');
      }
    }
  }, [user, profile, isLoading]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Moon icon with stars animation */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 animate-pulse">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="50" cy="50" r="45" fill="url(#moonGradient)" />
              <defs>
                <radialGradient id="moonGradient" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#f9fafb" />
                  <stop offset="100%" stopColor="#d1d5db" />
                </radialGradient>
              </defs>
            </svg>
          </div>
          
          {/* Craters */}
          <div className="absolute top-[25%] left-[30%] w-[12%] h-[12%] rounded-full bg-gray-300"></div>
          <div className="absolute top-[60%] left-[20%] w-[8%] h-[8%] rounded-full bg-gray-300"></div>
          <div className="absolute top-[40%] right-[25%] w-[15%] h-[15%] rounded-full bg-gray-300"></div>
          
          {/* Stars */}
          <div className="absolute top-[10%] right-[10%] w-1 h-1 bg-white rounded-full animate-twinkle"></div>
          <div className="absolute top-[80%] right-[30%] w-2 h-2 bg-white rounded-full animate-twinkle-delay"></div>
          <div className="absolute top-[30%] left-[5%] w-1.5 h-1.5 bg-white rounded-full animate-twinkle-slow"></div>
          <div className="absolute top-[50%] right-[0%] w-1 h-1 bg-white rounded-full animate-twinkle"></div>
          <div className="absolute top-[70%] left-[10%] w-2 h-2 bg-white rounded-full animate-twinkle-delay"></div>
        </div>
        
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Houston, we have a problem</h2>
        <p className="text-gray-500 mt-2">
          The page you're looking for seems to have drifted into deep space
        </p>
        
        <div className="pt-6 animate-float">
          <Link href={redirect} className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-all duration-200 shadow-lg hover:shadow-xl">
            <FiChevronLeft className="mr-2" />
            Return to Mission Control
          </Link>
        </div>
      </div>
    </div>
  );
}