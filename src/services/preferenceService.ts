// Preference Service - Hybrid localStorage + Supabase sync
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getCurrentSession } from './authService';

export type MushafViewMode = 'mushaf' | 'text';

export interface UserPreferences {
  mushafViewMode: MushafViewMode;
  // Future: Add more preferences here
  // recitationStyle?: 'hafs' | 'warsh' | 'qaloun';
  // fontSize?: 'small' | 'medium' | 'large';
}

const PREFERENCES_KEY = 'user_preferences';
const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-bf07b5b1`;

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  mushafViewMode: 'mushaf', // Default to Mushaf image mode for authentic experience
};

/**
 * Get preferences from localStorage (instant)
 */
function getLocalPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading local preferences:', error);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save preferences to localStorage (instant)
 */
function setLocalPreferences(preferences: Partial<UserPreferences>): void {
  try {
    const current = getLocalPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving local preferences:', error);
  }
}

/**
 * Load preferences (hybrid: local first, then sync from server)
 */
export async function loadPreferences(): Promise<UserPreferences> {
  // Step 1: Get from localStorage (instant)
  const localPrefs = getLocalPreferences();
  
  // Step 2: Try to sync from server if authenticated
  try {
    const session = await getCurrentSession();
    
    if (session.isAuthenticated && session.accessToken) {
      // Fetch from server
      const response = await fetch(`${SERVER_URL}/preferences`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      
      if (response.ok) {
        const serverPrefs = await response.json();
        // Merge (server wins for conflicts)
        const merged = { ...localPrefs, ...serverPrefs };
        
        // Update local cache
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(merged));
        
        console.log('✅ Preferences synced from server');
        return merged;
      }
    }
  } catch (error) {
    console.log('📱 Using local preferences (offline or error)');
  }
  
  return localPrefs;
}

/**
 * Save preference (hybrid: local immediately, server in background)
 */
export async function savePreference(
  key: keyof UserPreferences,
  value: any
): Promise<void> {
  // Step 1: Save locally (instant feedback)
  setLocalPreferences({ [key]: value });
  
  // Step 2: Sync to server in background (don't block UI)
  try {
    const session = await getCurrentSession();
    
    if (session.isAuthenticated && session.accessToken) {
      // Send to server (don't await - fire and forget)
      fetch(`${SERVER_URL}/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      }).then((response) => {
        if (response.ok) {
          console.log('✅ Preference synced to server');
        }
      }).catch((error) => {
        console.log('⚠️ Preference will sync when online:', error);
      });
    }
  } catch (error) {
    // Silent fail - preference is saved locally
    console.log('📱 Preference saved locally (will sync when authenticated)');
  }
}

/**
 * Get current mushaf view mode
 */
export function getMushafViewMode(): MushafViewMode {
  const prefs = getLocalPreferences();
  return prefs.mushafViewMode;
}

/**
 * Set mushaf view mode
 */
export async function setMushafViewMode(mode: MushafViewMode): Promise<void> {
  await savePreference('mushafViewMode', mode);
}
