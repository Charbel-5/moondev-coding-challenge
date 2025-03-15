import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';

// For client-side usage (in components)
export const createClient = () => createClientComponentClient<Database>();