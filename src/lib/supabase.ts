import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Create a single shared Supabase client instance
// This prevents the "Multiple GoTrueClient instances" warning
export const supabase = createClient(supabaseUrl, publicAnonKey);