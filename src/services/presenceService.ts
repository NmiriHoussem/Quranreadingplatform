import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { refreshSession } from './authService';

const supabaseUrl = `https://${projectId}.supabase.co`;

export interface PresenceData {
  activeReaders: number;
  activeReadersExcludingSelf?: number;
  readers?: Array<{
    userId: string;
    userName: string;
    lastSeen: string;
  }>;
}

// Update user's presence (heartbeat)
export async function updatePresence(groupId: string): Promise<PresenceData | null> {
  try {
    // Skip if offline
    if (!navigator.onLine) {
      console.log('📵 [PRESENCE] Offline - skipping presence update');
      return null;
    }
    
    let accessToken = localStorage.getItem('auth_token');
    
    if (!accessToken) {
      console.log('No access token - skipping presence update');
      return null;
    }

    // First attempt
    let response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-bf07b5b1/groups/${groupId}/presence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`, // Use anon key for gateway
          'X-User-Token': accessToken // Pass user token in custom header
        }
      }
    );

    // If we get a 401, try refreshing the token and retry once
    if (response.status === 401) {
      console.log('🔄 [PRESENCE] Token expired, refreshing...');
      const refreshResult = await refreshSession();
      
      if (refreshResult.error || !refreshResult.accessToken) {
        console.error('Failed to refresh token:', refreshResult.error);
        return null;
      }
      
      accessToken = refreshResult.accessToken;
      
      // Retry with fresh token
      response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-bf07b5b1/groups/${groupId}/presence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': accessToken
          }
        }
      );
    }

    if (!response.ok) {
      console.error('Failed to update presence:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating presence:', error);
    return null;
  }
}