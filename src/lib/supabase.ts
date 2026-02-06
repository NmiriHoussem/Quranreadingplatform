import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Create a single Supabase client instance with proper configuration
// This prevents multiple GoTrueClient instances from being created
export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    // Use a consistent storage key across the app
    storageKey: 'sb-auth-token',
    // Auto refresh tokens
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL (for email confirmations, etc.)
    detectSessionInUrl: true
  }
});