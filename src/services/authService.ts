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
    const { data: { session } } = await supabase.auth.getSession();

    if (session && session.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || 'User'
      };

      // Update localStorage
      localStorage.setItem('auth_token', session.access_token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      return {
        user,
        accessToken: session.access_token,
        isAuthenticated: true
      };
    }

    return {
      user: null,
      accessToken: null,
      isAuthenticated: false
    };
  } catch (error) {
    console.error('Get session error:', error);
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false
    };
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
