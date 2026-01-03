import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getUserData, saveUserData, UserData } from '../app/utils/localStorage';
import { refreshSession } from './authService';

const supabaseUrl = `https://${projectId}.supabase.co`;
const serverUrl = `${supabaseUrl}/functions/v1/make-server-bf07b5b1`;

// Get access token from localStorage
function getAccessToken(): string | null {
  const token = localStorage.getItem('auth_token'); // Changed from 'quran_access_token' to 'auth_token'
  
  // Don't log token details anymore - just return it
  // The authService handles token validation and refresh
  
  return token;
}

// Test JWT authentication
export async function testAuth(): Promise<void> {
  const accessToken = getAccessToken();
  console.log('🧪 Testing JWT authentication...');
  console.log('  - Access token:', accessToken?.substring(0, 50));
  
  // FIRST: Test if the public endpoint is reachable (with anon key)
  console.log('🔓 Step 1: Testing public endpoint (with anon key)...');
  try {
    const publicResponse = await fetch(`${serverUrl}/test-public`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}` // Use anon key, not user token!
      }
    });
    const publicData = await publicResponse.json();
    console.log('  - ✅ Public endpoint response:', publicData);
    console.log('  - Server is reachable!');
  } catch (error) {
    console.error('  - ❌ Public endpoint failed:', error);
    console.error('  - Server is NOT reachable - deployment issue!');
    return;
  }
  
  if (!accessToken) {
    console.error('  - No access token available');
    return;
  }
  
  // SECOND: Test authenticated endpoint (anon key + user token in custom header)
  console.log('🔐 Step 2: Testing authenticated endpoint...');
  try {
    const response = await fetch(`${serverUrl}/test-auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`, // Use anon key for gateway
        'X-User-Token': accessToken // Pass user token in custom header
      }
    });
    
    const data = await response.json();
    console.log('  - Test response:', data);
    
    if (data.success) {
      console.log('  - ✅ JWT authentication working!');
      console.log('  - User ID:', data.userId);
    } else {
      console.error('  - ❌ JWT authentication failed:', data.error);
    }
  } catch (error) {
    console.error('  -  Test exception:', error);
  }
}

// Save user progress to server
export async function saveProgressToServer(): Promise<{ success: boolean; error: string | null }> {
  try {
    // Check if online before attempting to sync
    if (!navigator.onLine) {
      console.log('📵 [SYNC] Offline - skipping server sync');
      return { success: false, error: 'Offline' };
    }
    
    const accessToken = getAccessToken();
    console.log('💾 [SYNC] Saving progress to server...');
    console.log('  - Has access token:', !!accessToken);
    console.log('  - Access token (first 30 chars):', accessToken?.substring(0, 30));
    
    if (!accessToken) {
      console.warn('  - ⚠️  No access token, skipping save');
      return { success: false, error: 'Not authenticated' };
    }

    const userData = getUserData();
    console.log('  - User data to save:', {
      pagesRead: Object.keys(userData.readingProgress || {}).length,
      groups: userData.groups.length,
      khatmahGroups: Object.keys(userData.khatmahProgress || {}).length,
      memorizedSurahs: Object.keys(userData.memorizationProgress || {}).length
    });
    
    console.log('  - Making POST request to:', `${serverUrl}/progress/save`);
    
    const response = await fetch(`${serverUrl}/progress/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`, // Use anon key for gateway
        'X-User-Token': accessToken // Pass user token in custom header
      },
      body: JSON.stringify(userData)
    });

    console.log('  - Response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('  - Response data:', data);

    if (!response.ok) {
      console.error('❌ [SYNC] Failed to save progress:', data.error);
      return { success: false, error: data.error || 'Failed to save progress' };
    }

    console.log('✅ [SYNC] Progress saved to server successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ [SYNC] Save progress exception:', error);
    return { success: false, error: 'Failed to save progress to server' };
  }
}

// Load user progress from server
export async function loadProgressFromServer(): Promise<{ success: boolean; error: string | null; data?: UserData }> {
  try {
    const accessToken = getAccessToken();
    console.log('📥 [SYNC] Loading progress from server...');
    console.log('  - Has access token:', !!accessToken);
    
    if (!accessToken) {
      console.warn('  - ⚠️  No access token, skipping load');
      return { success: false, error: 'Not authenticated' };
    }

    console.log('  - Making GET request to:', `${serverUrl}/progress`);
    
    const response = await fetch(`${serverUrl}/progress`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`, // Use anon key for gateway
        'X-User-Token': accessToken // Pass user token in custom header
      }
    });

    console.log('  - Response status:', response.status, response.statusText);
    console.log('  - Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Try to get response text first to see what we're receiving
    const responseText = await response.text();
    console.log('  - Raw response text:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('  - ❌ JSON parse error:', parseError);
      console.error('  - Response was:', responseText);
      return { success: false, error: 'Invalid response from server' };
    }

    if (!response.ok) {
      console.error('❌ [SYNC] Failed to load progress - HTTP', response.status);
      console.error('  - Error details:', result);
      return { success: false, error: result.error || `HTTP ${response.status}: ${response.statusText}` };
    }

    if (result.progress) {
      // Merge server data with local data (server takes precedence)
      const localData = getUserData();
      const mergedData = mergeProgressData(localData, result.progress);
      saveUserData(mergedData);
      
      console.log('✅ [SYNC] Progress loaded from server successfully');
      console.log('  - Merged data:', {
        pagesRead: Object.keys(mergedData.readingProgress || {}).length,
        groups: mergedData.groups.length
      });
      return { success: true, error: null, data: mergedData };
    }

    console.log('ℹ️  [SYNC] No progress data on server');
    return { success: true, error: null, data: undefined };
  } catch (error) {
    console.error('❌ [SYNC] Load progress exception:', error);
    console.error('  - Error type:', error?.constructor?.name);
    console.error('  - Error message:', error?.message);
    console.error('  - Full error:', error);
    return { success: false, error: `Failed to load progress: ${error?.message || error}` };
  }
}

// Merge local and server progress data
function mergeProgressData(local: UserData, server: UserData): UserData {
  return {
    // Merge groups - combine both local and server groups
    groups: Array.from(new Set([...local.groups, ...server.groups])),
    
    // Merge khatmahProgress - merge page-by-page for each group
    khatmahProgress: mergeKhatmahProgress(local.khatmahProgress, server.khatmahProgress),
    
    // Merge juzProgress - merge each juz with timestamp comparison
    juzProgress: mergeJuzProgress(local.juzProgress, server.juzProgress),
    
    // Merge readingProgress - merge page-by-page
    readingProgress: mergeReadingProgress(local.readingProgress || {}, server.readingProgress || {}),
    
    // Merge memorizationProgress - combine all memorized ayahs
    memorizationProgress: mergeMemorizationProgress(local.memorizationProgress, server.memorizationProgress),
    
    // Merge completedSurahs - combine both lists
    completedSurahs: Array.from(new Set([...local.completedSurahs, ...server.completedSurahs])),
    
    // Take the most recent lastRead
    lastRead: getMostRecentLastRead(local.lastRead, server.lastRead),
    
    // Merge completedKhatmahs - combine both lists
    completedKhatmahs: Array.from(new Set([...(local.completedKhatmahs || []), ...(server.completedKhatmahs || [])]))
  };
}

// Helper: Merge reading progress page-by-page
function mergeReadingProgress(
  local: UserData['readingProgress'],
  server: UserData['readingProgress']
): UserData['readingProgress'] {
  const merged: UserData['readingProgress'] = { ...local };

  for (const pageNum in server) {
    if (!merged[pageNum]) {
      // Page only exists on server, add it
      merged[pageNum] = server[pageNum];
    } else {
      // Page exists in both, keep the most recent
      const localTime = new Date(merged[pageNum].timestamp).getTime();
      const serverTime = new Date(server[pageNum].timestamp).getTime();
      if (serverTime > localTime) {
        merged[pageNum] = server[pageNum];
      }
    }
  }

  return merged;
}

// Helper: Merge khatmah progress group-by-group, then page-by-page
function mergeKhatmahProgress(
  local: UserData['khatmahProgress'],
  server: UserData['khatmahProgress']
): UserData['khatmahProgress'] {
  const merged: UserData['khatmahProgress'] = { ...local };

  for (const groupId in server) {
    if (!merged[groupId]) {
      // Group only exists on server, add it
      merged[groupId] = server[groupId];
    } else {
      // Group exists in both, merge pages within this group
      merged[groupId] = mergeReadingProgress(merged[groupId], server[groupId]);
    }
  }

  return merged;
}

// Helper: Merge juz progress with timestamp comparison
function mergeJuzProgress(
  local: UserData['juzProgress'],
  server: UserData['juzProgress']
): UserData['juzProgress'] {
  const merged: UserData['juzProgress'] = { ...local };

  for (const juzNum in server) {
    if (!merged[juzNum]) {
      // Juz only exists on server, add it
      merged[juzNum] = server[juzNum];
    } else {
      // Juz exists in both, keep the most recent
      const localTime = new Date(merged[juzNum].timestamp).getTime();
      const serverTime = new Date(server[juzNum].timestamp).getTime();
      if (serverTime > localTime) {
        merged[juzNum] = server[juzNum];
      }
    }
  }

  return merged;
}

// Helper: Get most recent lastRead
function getMostRecentLastRead(
  local: UserData['lastRead'],
  server: UserData['lastRead']
): UserData['lastRead'] {
  if (!local) return server;
  if (!server) return local;
  
  const localTime = new Date(local.timestamp).getTime();
  const serverTime = new Date(server.timestamp).getTime();
  
  return serverTime > localTime ? server : local;
}

// Merge memorization progress
function mergeMemorizationProgress(
  local: UserData['memorizationProgress'],
  server: UserData['memorizationProgress']
): UserData['memorizationProgress'] {
  const merged: UserData['memorizationProgress'] = { ...local };

  for (const surahNum in server) {
    if (!merged[surahNum]) {
      merged[surahNum] = server[surahNum];
    } else {
      // Merge ayahs for this surah
      merged[surahNum] = {
        ...merged[surahNum],
        ...server[surahNum]
      };
    }
  }

  return merged;
}

// Join a group on server
export async function joinGroupOnServer(groupId: string): Promise<{ success: boolean; memberCount?: number; error?: string }> {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${serverUrl}/groups/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to join group' };
    }

    return { success: true, memberCount: data.memberCount };
  } catch (error) {
    console.error('Join group on server error:', error);
    return { success: false, error: 'Failed to join group on server' };
  }
}

// Leave a group on server
export async function leaveGroupOnServer(groupId: string): Promise<{ success: boolean; memberCount?: number; error?: string }> {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${serverUrl}/groups/${groupId}/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to leave group' };
    }

    return { success: true, memberCount: data.memberCount };
  } catch (error) {
    console.error('Leave group on server error:', error);
    return { success: false, error: 'Failed to leave group on server' };
  }
}

// Get group member count
export async function getGroupMemberCount(groupId: string): Promise<number> {
  try {
    const response = await fetch(`${serverUrl}/groups/${groupId}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to get member count:', data.error);
      return 0;
    }

    return data.memberCount || 0;
  } catch (error) {
    console.error('Get group member count error:', error);
    return 0;
  }
}

// Auto-sync progress (debounced)
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function autoSyncProgress(): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    saveProgressToServer();
  }, 2000); // Sync 2 seconds after last change
}