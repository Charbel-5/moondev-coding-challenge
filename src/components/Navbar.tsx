"use client";

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Hide navbar on login page
  if (pathname === '/login' || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Navigate first, then sign out to avoid the "Please login" message
      router.push('/login');
      
      // Small timeout to ensure navigation completes first
      setTimeout(async () => {
        await signOut();
      }, 100);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <span className="text-xl font-semibold">MoonDev Challenge</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {user?.email} ({user?.role})
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiLogOut className="mr-2 -ml-1 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}