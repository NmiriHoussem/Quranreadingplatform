-- ========================================
-- PRIVATE KHATMAH INVITATIONS - COMPLETE FIX
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- STEP 1: Check if invitations exist
-- This will show you what's currently in the database
SELECT 
  i.id,
  i.email as invitation_email,
  i.status,
  i.invited_at,
  i.invited_by,
  k.name as khatmah_name,
  k.created_by as khatmah_creator
FROM public.private_khatmah_invitations i
LEFT JOIN public.private_khatmahs k ON i.khatmah_id = k.id
ORDER BY i.invited_at DESC;

-- STEP 2: Check current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'private_khatmah_invitations';

-- ========================================
-- STEP 3: FIX RLS POLICIES
-- ========================================

-- Enable RLS on the table
ALTER TABLE public.private_khatmah_invitations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.private_khatmah_invitations;
DROP POLICY IF EXISTS "Users can view their invitations" ON public.private_khatmah_invitations;
DROP POLICY IF EXISTS "Users can insert invitations" ON public.private_khatmah_invitations;
DROP POLICY IF EXISTS "Users can update their invitations" ON public.private_khatmah_invitations;
DROP POLICY IF EXISTS "Allow khatmah creators to invite" ON public.private_khatmah_invitations;
DROP POLICY IF EXISTS "Allow users to view invitations sent to them" ON public.private_khatmah_invitations;
DROP POLICY IF EXISTS "Allow users to accept/decline invitations" ON public.private_khatmah_invitations;

-- ========================================
-- CREATE NEW COMPREHENSIVE RLS POLICIES
-- ========================================

-- 1. SELECT Policy - Who can view invitations
CREATE POLICY "Users can view invitations" ON public.private_khatmah_invitations
  FOR SELECT
  USING (
    -- User sent the invitation
    invited_by = auth.uid() 
    OR
    -- Invitation is sent to user's email (case-insensitive)
    LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    OR
    -- User created the khatmah
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );

-- 2. INSERT Policy - Who can create invitations
CREATE POLICY "Khatmah creators can invite" ON public.private_khatmah_invitations
  FOR INSERT
  WITH CHECK (
    -- User must be the creator of the khatmah they're inviting to
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
    OR
    -- Or the invited_by field matches the current user
    invited_by = auth.uid()
  );

-- 3. UPDATE Policy - Who can update invitations
CREATE POLICY "Users can update invitations" ON public.private_khatmah_invitations
  FOR UPDATE
  USING (
    -- User received the invitation (can accept/decline)
    LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    OR
    -- User sent the invitation (can cancel)
    invited_by = auth.uid()
    OR
    -- User created the khatmah
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    -- Same conditions for the updated row
    LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    OR
    invited_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );

-- ========================================
-- STEP 4: NORMALIZE EXISTING DATA
-- ========================================

-- Normalize all emails to lowercase
UPDATE public.private_khatmah_invitations 
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

UPDATE public.private_khatmah_members 
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

-- ========================================
-- STEP 5: VERIFY THE FIX
-- ========================================

-- Check policies are created
SELECT 
  policyname,
  cmd as command,
  permissive
FROM pg_policies 
WHERE tablename = 'private_khatmah_invitations';

-- Check if houssem.addin@gmail.com has any invitations
-- Replace with actual user email if different
SELECT 
  i.*,
  k.name as khatmah_name
FROM public.private_khatmah_invitations i
LEFT JOIN public.private_khatmahs k ON i.khatmah_id = k.id
WHERE LOWER(TRIM(i.email)) = 'houssem.addin@gmail.com';

-- ========================================
-- STEP 6: CREATE TEST INVITATION (OPTIONAL)
-- ========================================

-- ONLY run this if you want to create a test invitation
-- Replace the values with actual data

/*
-- First, get the creator user ID (contact@ndev.digital)
SELECT id, email FROM auth.users WHERE email = 'contact@ndev.digital';

-- Then get or create a test khatmah
-- If you already have a khatmah, get its ID:
SELECT id, name, created_by FROM public.private_khatmahs ORDER BY created_at DESC LIMIT 1;

-- Create test invitation (replace UUIDs with actual values)
INSERT INTO public.private_khatmah_invitations (
  khatmah_id,
  email,
  invited_by,
  status
) VALUES (
  'KHATMAH_ID_HERE',  -- Replace with actual khatmah ID
  'houssem.addin@gmail.com',
  'CREATOR_USER_ID_HERE',  -- Replace with contact@ndev.digital's user ID
  'pending'
)
ON CONFLICT DO NOTHING;

-- Also add to members table
INSERT INTO public.private_khatmah_members (
  khatmah_id,
  email,
  status
) VALUES (
  'KHATMAH_ID_HERE',  -- Same khatmah ID
  'houssem.addin@gmail.com',
  'pending'
)
ON CONFLICT DO NOTHING;
*/

-- ========================================
-- STEP 7: FINAL VERIFICATION QUERY
-- ========================================

-- Run this to see all invitations that houssem.addin@gmail.com should see
-- This simulates what the RLS policy will allow
SELECT 
  i.id,
  i.email as invited_email,
  i.status,
  i.invited_at,
  k.name as khatmah_name,
  k.duration,
  creator.email as created_by_email
FROM public.private_khatmah_invitations i
JOIN public.private_khatmahs k ON i.khatmah_id = k.id
JOIN auth.users creator ON k.created_by = creator.id
WHERE 
  -- Match invitations for this email
  LOWER(TRIM(i.email)) = 'houssem.addin@gmail.com'
  AND i.status = 'pending'
ORDER BY i.invited_at DESC;

-- ========================================
-- SUCCESS INDICATORS
-- ========================================
-- ✅ Step 1 should show existing invitations (or empty if none)
-- ✅ Step 2 should show old policies (or empty)
-- ✅ Step 3 creates new policies (no output)
-- ✅ Step 4 normalizes emails (shows row count updated)
-- ✅ Step 5 should show 3 new policies (SELECT, INSERT, UPDATE)
-- ✅ Step 6 (optional) creates test data
-- ✅ Step 7 should show invitations for houssem.addin@gmail.com
