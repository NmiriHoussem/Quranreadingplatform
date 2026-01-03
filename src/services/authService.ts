import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

// Sign up a new user
export async function signUp(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-bf07b5b1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, name })
    });

    const data = await response.json();

    if (!response.ok) {
      return { user: null, error: data.error || 'Failed to sign up' };
    }

    // After signup, sign in the user
    return signIn(email, password);
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, error: 'Failed to sign up. Please try again.' };
  }
}

// Sign in an existing user
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      return { user: null, error: error?.message || 'Failed to sign in' };
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || 'User'
    };

    // Save auth state to localStorage
    localStorage.setItem('auth_token', data.session.access_token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    return { user, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, error: 'Failed to sign in. Please try again.' };
  }
}

// Sign out the current user
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// Get current session
export async function getCurrentSession(): Promise<AuthState> {
  try {
    // Check if we have a stored token first
    const storedToken = localStorage.getItem('auth_token');
    
    // If we have a stored token, check if it's expired
    if (storedToken) {
      try {
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const payload = JSON.parse(atob(base64));
          const now = Math.floor(Date.now() / 1000);
          
          // If token expired more than 1 hour ago, it's definitely too old to refresh
          // Clear it immediately without trying to refresh
          if (payload.exp && payload.exp < (now - 3600)) {
            console.log('🔄 [AUTH] Token expired over 1 hour ago, clearing session...');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            await supabase.auth.signOut();
            return {
              user: null,
              accessToken: null,
              isAuthenticated: false
            };
          }
        }
      } catch (e) {
        // If we can't decode, clear and continue
        console.log('🔄 [AUTH] Cannot decode token, clearing...');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    // Try to refresh the session to get a fresh token
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
    
    // If refresh failed, try getting the current session
    if (refreshError || !session) {
      console.log('🔄 [AUTH] Refresh failed, checking current session...');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession && currentSession.user) {
        const user: User = {
          id: currentSession.user.id,
          email: currentSession.user.email!,
          name: currentSession.user.user_metadata?.name || 'User'
        };

        // Update localStorage
        localStorage.setItem('auth_token', currentSession.access_token);
        localStorage.setItem('auth_user', JSON.stringify(user));

        return {
          user,
          accessToken: currentSession.access_token,
          isAuthenticated: true
        };
      }
      
      // No valid session - sign out completely
      console.log('🔄 [AUTH] No valid session, signing out...');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      await supabase.auth.signOut();
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false
      };
    }

    // Refresh was successful
    console.log('✅ [AUTH] Session refreshed successfully');
    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name || 'User'
    };

    // Update localStorage with fresh token
    localStorage.setItem('auth_token', session.access_token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    return {
      user,
      accessToken: session.access_token,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Get session error:', error);
    // Clear invalid tokens and sign out
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    await supabase.auth.signOut();
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false
    };
  }
}

// Refresh the current session to get a new access token
export async function refreshSession(): Promise<{ accessToken: string | null; error: string | null }> {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error || !session) {
      console.error('Session refresh error:', error);
      // Clear invalid tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return { accessToken: null, error: error?.message || 'Failed to refresh session' };
    }
    
    // Update localStorage with fresh token
    localStorage.setItem('auth_token', session.access_token);
    
    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name || 'User'
    };
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    return { accessToken: session.access_token, error: null };
  } catch (error) {
    console.error('Refresh session error:', error);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    return { accessToken: null, error: 'Failed to refresh session' };
  }
}

// Get user from localStorage (for quick checks)
export function getStoredUser(): User | null {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

// Get access token from localStorage
export function getAccessToken(): string | null {
  return localStorage.getItem('auth_token');
}