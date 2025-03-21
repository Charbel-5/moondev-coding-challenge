import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a server-side client with admin privileges (for use in server components or API routes)
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key');
  }
  return createClient(supabaseUrl, serviceRoleKey);
};

/**
 * Parse a Supabase storage URL to extract bucket and path
 */
export function parseStorageUrl(url: string): { bucket: string, path: string } | null {
  if (!url) return null;
  
  try {
    // This pattern matches URLs like:
    // https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const regex = /\/storage\/v1\/object\/(?:public|auth)\/([^/]+)\/(.+)$/;
    const matches = url.match(regex);
    
    if (matches && matches.length >= 3) {
      return {
        bucket: matches[1],
        path: matches[2]
      };
    }
    
    console.error('URL format not recognized:', url);
    return null;
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return null;
  }
}

/**
 * Get a signed URL for a file in Supabase Storage
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 60 * 60) {
  try {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    
    return data?.signedUrl;
  } catch (error) {
    console.error('Exception getting signed URL:', error);
    return null;
  }
}