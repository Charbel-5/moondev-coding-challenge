"use client";

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { Button } from './ui/Button';
import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide navbar on login page
  if (pathname === '/login' || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Navigate first, then sign out to avoid the "Please login" message
      router.push('/login');
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Small timeout to ensure navigation completes first
      setTimeout(async () => {
        await signOut();
      }, 100);
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-soft sticky top-0 z-10 border-b border-neutral-100 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand Name */}
          <div className="flex-shrink-0 flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                MoonDev
              </span>
              <span className="text-neutral-600 dark:text-neutral-300 hidden sm:inline-block">Challenge</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700">
              {user?.email} <span className="text-primary">({user?.role})</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-neutral-700 dark:text-neutral-300"
            >
              <FiLogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <FiX className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-neutral-100 dark:border-neutral-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="block px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
              {user?.email} <span className="text-primary">({user?.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <FiLogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}