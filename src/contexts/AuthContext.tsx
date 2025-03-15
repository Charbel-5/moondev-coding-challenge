'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { User, Session } from '@supabase/supabase-js';

type UserRole = 'developer' | 'evaluator';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any } | undefined>;
  signOut: () => Promise<void>;
  isRole: (role: UserRole) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthChange(event, session);
    });

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleAuthChange('INITIAL', session);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Clean up subscription on unmount
    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  async function handleAuthChange(event: string, session: Session | null) {
    if (session && session.user) {
      setUser(session.user);
      await fetchUserProfile(session.user.id);
    } else {
      setUser(null);
      setProfile(null);
    }
  }

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      if (data.user) {
        toast.success('Login successful!');
        await fetchUserProfile(data.user.id);
        
        // Redirect based on role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (profile) {
          if (profile.role === 'developer') {
            router.replace('/submit');
          } else if (profile.role === 'evaluator') {
            router.replace('/evaluate');
          }
        }
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  }

  function isRole(role: UserRole): boolean {
    return profile?.role === role;
  }

  async function refreshUser() {
    if (user) {
      await fetchUserProfile(user.id);
    }
  }

  const value = {
    user,
    profile,
    isLoading,
    signIn,
    signOut,
    isRole,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};