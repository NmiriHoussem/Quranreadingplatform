// Anonymous session ID management for activity tracking
// Uses localStorage to persist session across page reloads

const SESSION_KEY = 'quran_anonymous_session_id';

/**
 * Get or create an anonymous session ID
 * This is used for tracking "reading with you now" without requiring authentication
 */
export function getOrCreateSessionId(): string {
  // Check if session ID already exists
  const existing = localStorage.getItem(SESSION_KEY);
  
  if (existing && existing.startsWith('anon_')) {
    return existing;
  }
  
  // Generate new session ID using crypto.randomUUID if available
  let sessionId: string;
  
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    sessionId = `anon_${crypto.randomUUID()}`;
  } else {
    // Fallback for older browsers
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  // Save to localStorage
  localStorage.setItem(SESSION_KEY, sessionId);
  
  return sessionId;
}

/**
 * Get existing session ID without creating a new one
 */
export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

/**
 * Clear session ID (useful for testing or manual reset)
 */
export function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}
