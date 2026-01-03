import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { decode } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const app = new Hono();

// Configure CORS - MUST be first middleware
app.use('*', cors({
  origin: '*', // Allow all origins
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Token'], // Added X-User-Token
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Add logger
app.use('*', logger(console.log));

// Hardcoded configuration (since env vars aren't accessible in Figma Make)
const projectId = 'sxtdsxaibifgvtyeatzl';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGRzeGFpYmlmZ3Z0eWVhdHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzM1MjYsImV4cCI6MjA4MjYwOTUyNn0.31i1JKdXazyCRODjm5ZPiDP3ao5MiZhIwCcgDJ57wqE';
const supabaseUrl = `https://${projectId}.supabase.co`;

console.log('🚀 Server starting...');
console.log('  📍 Supabase URL:', supabaseUrl);
console.log('  📦 Using KV store from kv_store.tsx');

// Create a Supabase client for auth operations
// We'll use the anon key for public operations with RLS
const supabase = createClient(supabaseUrl, publicAnonKey);

// Try to get service role key for admin operations (signup)
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 
                           Deno.env.get('SUPABASE_SERVICE_KEY') ||
                           Deno.env.get('SERVICE_ROLE_KEY') ||
                           Deno.env.get('SUPABASE_SERVICE_ROLE');

console.log('🔑 Checking for service role key...');
console.log('  - SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Found' : 'Not found');
console.log('  - SUPABASE_SERVICE_KEY:', Deno.env.get('SUPABASE_SERVICE_KEY') ? 'Found' : 'Not found');
console.log('  - SERVICE_ROLE_KEY:', Deno.env.get('SERVICE_ROLE_KEY') ? 'Found' : 'Not found');
console.log('  - All env vars:', Object.keys(Deno.env.toObject()).join(', '));

// TEMPORARY DEBUG: Print ALL environment variable values (will remove after debugging)
const allEnvs = Deno.env.toObject();
console.log('📋 Full environment variables:');
Object.entries(allEnvs).forEach(([key, value]) => {
  if (key.toLowerCase().includes('supabase') || key.toLowerCase().includes('service')) {
    console.log(`  - ${key}:`, value.substring(0, 50) + '...');
  } else {
    console.log(`  - ${key}: <value hidden>`);
  }
});

// Admin client (for signup and JWT validation) - uses service role key if available
let adminSupabase: any = null;
if (supabaseServiceKey) {
  adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('  ✅ Admin client created with service role key');
  console.log('  - Service role key (first 50 chars):', supabaseServiceKey.substring(0, 50));
} else {
  console.error('  ❌ No service role key found in environment variables!');
  console.error('  ❌ JWT authentication and signup will NOT work!');
}

// Helper function to get user ID from access token (using user's own token)
async function getUserIdFromToken(authHeader: string | null): Promise<{ userId: string | null; error: string | null }> {
  if (!authHeader) {
    console.error('❌ [AUTH] Missing X-User-Token header');
    return { userId: null, error: 'Missing user token header' };
  }
  
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  if (!accessToken) {
    console.error('❌ [AUTH] Invalid X-User-Token header format');
    return { userId: null, error: 'Invalid user token header format' };
  }
  
  // Manual base64 decoding only (skip djwt to avoid issues)
  try {
    console.log('🔍 [AUTH] Decoding JWT manually...');
    console.log('  - Token (first 50 chars):', accessToken.substring(0, 50));
    
    const parts = accessToken.split('.');
    
    if (parts.length !== 3) {
      console.error('❌ [AUTH] Invalid JWT format - expected 3 parts, got:', parts.length);
      return { userId: null, error: 'Invalid JWT format' };
    }
    
    const payload = parts[1];
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const jsonString = atob(base64);
    const decoded = JSON.parse(jsonString);
    
    console.log('  - Decoded payload:', JSON.stringify(decoded, null, 2));
    
    const userId = decoded.sub;
    
    if (!userId) {
      console.error('❌ [AUTH] No user ID (sub) in JWT payload');
      return { userId: null, error: 'Invalid JWT: missing user ID' };
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      // Token is expired - return error without detailed logging
      // The client will handle refresh automatically
      return { userId: null, error: 'JWT expired' };
    }
    
    console.log('✅ [AUTH] JWT decoded successfully');
    console.log('  - User ID:', userId);
    console.log('  - Email:', decoded.email || 'N/A');
    console.log('  - Expires at:', decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'never');
    
    return { userId, error: null };
  } catch (manualError) {
    console.error('❌ [AUTH] Manual decoding failed:', manualError);
    console.error('  - Error type:', manualError?.constructor?.name);
    console.error('  - Error message:', manualError?.message);
    console.error('  - Stack trace:', manualError?.stack);
    return { userId: null, error: 'Failed to decode JWT' };
  }
}

// Health check endpoint
app.get("/make-server-bf07b5b1/health", (c) => {
  return c.json({ status: "ok" });
});

// Public test endpoint (no auth required) - to verify server is reachable
app.get('/make-server-bf07b5b1/test-public', (c) => {
  console.log('🔓 [PUBLIC-TEST] Public endpoint called successfully!');
  console.log('🔓 [PUBLIC-TEST] Headers:', Object.fromEntries(c.req.raw.headers.entries()));
  
  return c.json({ 
    success: true,
    message: 'Server is reachable!',
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(c.req.raw.headers.entries())
  });
});

// Test endpoint to verify JWT decoding
app.get('/make-server-bf07b5b1/test-auth', async (c) => {
  try {
    console.log('🧪 [TEST-AUTH] ======================');
    console.log('🧪 [TEST-AUTH] Endpoint called');
    console.log('🧪 [TEST-AUTH] Time:', new Date().toISOString());
    
    // Read user token from custom header
    const userTokenHeader = c.req.header('X-User-Token');
    console.log('🧪 [TEST-AUTH] X-User-Token header present:', !!userTokenHeader);
    console.log('🧪 [TEST-AUTH] X-User-Token value (first 50):', userTokenHeader?.substring(0, 50));
    
    if (!userTokenHeader) {
      return c.json({ 
        success: false, 
        error: 'No X-User-Token header provided',
        debugInfo: {
          hasUserToken: false,
          timestamp: new Date().toISOString()
        }
      }, 400);
    }
    
    const { userId, error } = await getUserIdFromToken(userTokenHeader);
    
    if (error) {
      console.error('🧪 [TEST-AUTH] Authentication failed:', error);
      return c.json({ 
        success: false, 
        error,
        debugInfo: {
          hasUserToken: !!userTokenHeader,
          userTokenFormat: userTokenHeader?.substring(0, 30) + '...',
          timestamp: new Date().toISOString()
        }
      }, 401);
    }
    
    console.log('🧪 [TEST-AUTH] Authentication successful:', userId);
    console.log('🧪 [TEST-AUTH] ======================');
    return c.json({ 
      success: true, 
      userId,
      message: 'JWT decoded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('🧪 [TEST-AUTH] Exception:', e);
    return c.json({
      success: false,
      error: 'Internal server error',
      details: e?.message,
      stack: e?.stack
    }, 500);
  }
});

// ===== AUTHENTICATION ROUTES =====

// Sign up
app.post("/make-server-bf07b5b1/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }
    
    if (!adminSupabase) {
      return c.json({ error: 'Signup failed: No service role key available' }, 500);
    }
    
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ user: data.user }, 201);
  } catch (error) {
    console.error('Signup exception:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// ===== USER PROGRESS ROUTES =====

// Save user progress (khatmah, memorization, juz)
app.post("/make-server-bf07b5b1/progress/save", async (c) => {
  try {
    const authHeader = c.req.header('X-User-Token'); // Changed from 'Authorization'
    const { userId, error: authError } = await getUserIdFromToken(authHeader);
    
    if (authError || !userId) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const progressData = await c.req.json();
    
    // Save to KV store with user ID as prefix
    const key = `user:${userId}:progress`;
    await kv.set(key, progressData); // Changed from db.set to kv.set
    
    return c.json({ success: true, message: 'Progress saved successfully' });
  } catch (error) {
    console.error('Save progress error:', error);
    return c.json({ error: 'Failed to save progress' }, 500);
  }
});

// Get user progress
app.get("/make-server-bf07b5b1/progress", async (c) => {
  try {
    console.log('📥 [PROGRESS] GET request received');
    
    const authHeader = c.req.header('X-User-Token'); // Changed from 'Authorization'
    console.log('📥 [PROGRESS] X-User-Token header present:', !!authHeader);
    
    const { userId, error: authError } = await getUserIdFromToken(authHeader);
    
    if (authError || !userId) {
      console.error('📥 [PROGRESS] Auth failed:', authError);
      return c.json({ 
        error: authError || 'Unauthorized',
        debugInfo: {
          hasAuthHeader: !!authHeader,
          authError,
          timestamp: new Date().toISOString()
        }
      }, 401);
    }
    
    console.log('📥 [PROGRESS] Auth successful, user:', userId);
    
    const key = `user:${userId}:progress`;
    const progressData = await kv.get(key); // Changed from db.get to kv.get
    
    console.log('📥 [PROGRESS] Retrieved data:', progressData ? 'Found' : 'Not found');
    
    return c.json({ progress: progressData || null });
  } catch (error) {
    console.error('📥 [PROGRESS] Exception:', error);
    return c.json({ 
      error: 'Failed to retrieve progress',
      details: error?.message 
    }, 500);
  }
});

// ===== GROUP ROUTES =====

// Join a group
app.post("/make-server-bf07b5b1/groups/:groupId/join", async (c) => {
  try {
    const authHeader = c.req.header('X-User-Token'); // Changed from 'Authorization'
    const { userId, error: authError } = await getUserIdFromToken(authHeader);
    
    if (authError || !userId) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const key = `group:${groupId}:members`;
    
    // Get current members
    let members = await kv.get(key) || []; // Changed from db.get to kv.get
    
    // Add user if not already a member
    if (!members.includes(userId)) {
      members.push(userId);
      await kv.set(key, members); // Changed from db.set to kv.set
    }
    
    return c.json({ success: true, memberCount: members.length });
  } catch (error) {
    console.error('Join group error:', error);
    return c.json({ error: 'Failed to join group' }, 500);
  }
});

// Leave a group
app.post("/make-server-bf07b5b1/groups/:groupId/leave", async (c) => {
  try {
    const authHeader = c.req.header('X-User-Token'); // Changed from 'Authorization'
    const { userId, error: authError } = await getUserIdFromToken(authHeader);
    
    if (authError || !userId) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const key = `group:${groupId}:members`;
    
    // Get current members
    let members = await kv.get(key) || []; // Changed from db.get to kv.get
    
    // Remove user
    members = members.filter((id: string) => id !== userId);
    await kv.set(key, members); // Changed from db.set to kv.set
    
    return c.json({ success: true, memberCount: members.length });
  } catch (error) {
    console.error('Leave group error:', error);
    return c.json({ error: 'Failed to leave group' }, 500);
  }
});

// Get group member count
app.get("/make-server-bf07b5b1/groups/:groupId/members", async (c) => {
  try {
    const groupId = c.req.param('groupId');
    const key = `group:${groupId}:members`;
    
    const members = await kv.get(key) || []; // Changed from db.get to kv.get
    
    return c.json({ memberCount: members.length });
  } catch (error) {
    console.error('Get group members error:', error);
    return c.json({ error: 'Failed to get member count' }, 500);
  }
});

// ===== PRESENCE ROUTES =====

// Update user's reading presence (heartbeat)
app.post("/make-server-bf07b5b1/groups/:groupId/presence", async (c) => {
  try {
    const authHeader = c.req.header('X-User-Token'); // Changed from 'Authorization'
    const { userId, error: authError } = await getUserIdFromToken(authHeader);
    
    if (authError || !userId) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const key = `group:${groupId}:presence`;
    
    // Get current presence data
    let presenceData = await kv.get(key) || {}; // Changed from db.get to kv.get
    
    // Update user's presence with current timestamp
    presenceData[userId] = {
      userId: userId,
      userName: 'Anonymous', // User metadata not available in this context
      lastSeen: new Date().toISOString()
    };
    
    // Save updated presence
    await kv.set(key, presenceData); // Changed from db.set to kv.set
    
    // Clean up old presence (remove users not seen in last 30 seconds)
    const now = new Date().getTime();
    const PRESENCE_TIMEOUT = 30000; // 30 seconds
    
    Object.keys(presenceData).forEach(userId => {
      const lastSeen = new Date(presenceData[userId].lastSeen).getTime();
      if (now - lastSeen > PRESENCE_TIMEOUT) {
        delete presenceData[userId];
      }
    });
    
    // Save cleaned presence
    await kv.set(key, presenceData); // Changed from db.set to kv.set
    
    // Count active readers (excluding current user to show "others")
    const activeCount = Object.keys(presenceData).length;
    
    return c.json({ 
      success: true, 
      activeReaders: activeCount,
      activeReadersExcludingSelf: Math.max(0, activeCount - 1)
    });
  } catch (error) {
    console.error('Update presence error:', error);
    return c.json({ error: 'Failed to update presence' }, 500);
  }
});

// Get active readers for a group
app.get("/make-server-bf07b5b1/groups/:groupId/presence", async (c) => {
  try {
    const groupId = c.req.param('groupId');
    const key = `group:${groupId}:presence`;
    
    // Get current presence data
    let presenceData = await kv.get(key) || {}; // Changed from db.get to kv.get
    
    // Clean up old presence (remove users not seen in last 30 seconds)
    const now = new Date().getTime();
    const PRESENCE_TIMEOUT = 30000; // 30 seconds
    
    Object.keys(presenceData).forEach(userId => {
      const lastSeen = new Date(presenceData[userId].lastSeen).getTime();
      if (now - lastSeen > PRESENCE_TIMEOUT) {
        delete presenceData[userId];
      }
    });
    
    // Save cleaned presence
    await kv.set(key, presenceData); // Changed from db.set to kv.set
    
    const activeCount = Object.keys(presenceData).length;
    
    return c.json({ 
      activeReaders: activeCount,
      readers: Object.values(presenceData)
    });
  } catch (error) {
    console.error('Get presence error:', error);
    return c.json({ error: 'Failed to get presence' }, 500);
  }
});

// ===== ANONYMOUS KHATMAH ACTIVITY TRACKING =====

// ===== USER PREFERENCES ROUTES =====

// Get user preferences
app.get("/make-server-bf07b5b1/preferences", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { userId, error: authError } = await getUserIdFromToken(authHeader);
    
    if (authError || !userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const key = `user:${userId}:preferences`;
    const preferences = await kv.get(key) || {};
    
    console.log('✅ [PREFERENCES] Retrieved for user:', userId);
    return c.json(preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    return c.json({ error: 'Failed to get preferences' }, 500);
  }
});

// Save user preferences
app.post("/make-server-bf07b5b1/preferences", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const { userId, error: authError } = await getUserIdFromToken(authHeader);
    
    if (authError || !userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const newPrefs = await c.req.json();
    const key = `user:${userId}:preferences`;
    
    // Get existing preferences
    const existing = await kv.get(key) || {};
    
    // Merge with new preferences
    const updated = { ...existing, ...newPrefs };
    
    // Save to KV store
    await kv.set(key, updated);
    
    console.log('✅ [PREFERENCES] Saved for user:', userId, updated);
    return c.json({ success: true });
  } catch (error) {
    console.error('Save preferences error:', error);
    return c.json({ error: 'Failed to save preferences' }, 500);
  }
});

// ===== ANONYMOUS KHATMAH ACTIVITY TRACKING =====

// Anonymous heartbeat for "reading with you now" feature
// NO AUTH REQUIRED - uses anonymous session IDs
app.post("/make-server-bf07b5b1/khatmah/heartbeat", async (c) => {
  try {
    const { sessionId } = await c.req.json();
    
    if (!sessionId || typeof sessionId !== 'string') {
      return c.json({ error: 'Valid sessionId required' }, 400);
    }
    
    console.log('💓 [HEARTBEAT] Received from session:', sessionId.substring(0, 20) + '...');
    
    const key = 'khatmah_activity';
    const now = Date.now();
    const STALE_THRESHOLD = 7 * 60 * 1000; // 7 minutes
    
    // Get current activity data
    let activityData = await kv.get(key) || { activeReaders: [] };
    
    console.log('💓 [HEARTBEAT] Current readers before cleanup:', activityData.activeReaders.length);
    
    // Clean up stale entries (older than 7 minutes)
    activityData.activeReaders = activityData.activeReaders.filter((reader: any) => {
      const isStale = now - reader.lastActive > STALE_THRESHOLD;
      if (isStale) {
        console.log('💓 [HEARTBEAT] Removing stale session:', reader.sessionId.substring(0, 20) + '...');
      }
      return !isStale;
    });
    
    console.log('💓 [HEARTBEAT] Readers after cleanup:', activityData.activeReaders.length);
    
    // Find existing session or add new one
    const existingIndex = activityData.activeReaders.findIndex(
      (reader: any) => reader.sessionId === sessionId
    );
    
    if (existingIndex >= 0) {
      // Update existing session
      activityData.activeReaders[existingIndex].lastActive = now;
      console.log('💓 [HEARTBEAT] Updated existing session');
    } else {
      // Add new session
      activityData.activeReaders.push({
        sessionId,
        lastActive: now
      });
      console.log('💓 [HEARTBEAT] Added new session');
    }
    
    // Save updated data
    await kv.set(key, activityData);
    
    const count = activityData.activeReaders.length;
    console.log('💓 [HEARTBEAT] Total active readers:', count);
    
    return c.json({ 
      count,
      timestamp: now
    });
  } catch (error) {
    console.error('💓 [HEARTBEAT] Error:', error);
    return c.json({ error: 'Failed to update heartbeat' }, 500);
  }
});

Deno.serve(app.fetch);