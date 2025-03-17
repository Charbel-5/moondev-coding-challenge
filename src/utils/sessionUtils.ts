import { createClient } from '@supabase/supabase-js';

// Session timeout in milliseconds - 1 hour
const SESSION_TIMEOUT = 60 * 60 * 1000;
// Key for storing last activity timestamp in localStorage
const LAST_ACTIVITY_KEY = 'lastActivity';

/**
 * Updates the last activity timestamp to the current time
 */
export function updateLastActivity() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }
}

/**
 * Checks if the user's session has timed out
 */
export function hasSessionTimedOut(): boolean {
  if (typeof window === 'undefined') return false;
  
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActivity) return false;
  
  const elapsed = Date.now() - parseInt(lastActivity, 10);
  return elapsed > SESSION_TIMEOUT;
}

/**
 * Gets the remaining time for the current session in milliseconds
 */
export function getSessionTimeRemaining(): number {
  if (typeof window === 'undefined') return SESSION_TIMEOUT;
  
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActivity) return SESSION_TIMEOUT;
  
  const elapsed = Date.now() - parseInt(lastActivity, 10);
  return Math.max(0, SESSION_TIMEOUT - elapsed);
}

/**
 * Resets the session timeout
 */
export function resetSessionTimeout() {
  updateLastActivity();
}

/**
 * Clears all session data
 */
export function clearSessionData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }
}

/**
 * Performs logout operations
 */
export async function logout() {
  clearSessionData();
  
  // Create a Supabase client to sign out
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  await supabase.auth.signOut();
}