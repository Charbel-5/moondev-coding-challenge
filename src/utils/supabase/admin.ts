import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing environment variables for Supabase admin client');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
};