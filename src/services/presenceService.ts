import { projectId, publicAnonKey } from '../../utils/supabase/info';

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
    
    const accessToken = localStorage.getItem('auth_token');
    
    if (!accessToken) {
      console.log('No access token - skipping presence update');
      return null;
    }

    const response = await fetch(
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

// Get active readers for a group
export async function getActiveReaders(groupId: string): Promise<PresenceData | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-bf07b5b1/groups/${groupId}/presence`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to get active readers:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting active readers:', error);
    return null;
  }
}