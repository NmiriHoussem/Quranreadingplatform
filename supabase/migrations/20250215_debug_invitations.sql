-- Debug and fix private khatmah invitations
-- This migration helps diagnose invitation issues

-- 1. Check for any invitations that might have incorrect email casing
-- (Run this in Supabase SQL Editor to see results)
-- SELECT * FROM public.private_khatmah_invitations WHERE status = 'pending';

-- 2. Normalize all emails to lowercase in existing invitations
UPDATE public.private_khatmah_invitations 
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

-- 3. Normalize all emails in members table as well
UPDATE public.private_khatmah_members 
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

-- 4. Add a check to see pending invitations for debugging
-- You can run this query manually to check:
-- SELECT 
--   i.id,
--   i.email as invitation_email,
--   i.status as invitation_status,
--   i.invited_at,
--   k.name as khatmah_name,
--   k.duration,
--   creator.email as creator_email
-- FROM public.private_khatmah_invitations i
-- JOIN public.private_khatmahs k ON i.khatmah_id = k.id
-- JOIN auth.users creator ON k.created_by = creator.id
-- WHERE i.status = 'pending'
-- ORDER BY i.invited_at DESC;

-- 5. Verify the RLS policy is working correctly
-- Drop and recreate the invitation view policy with better error handling
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.private_khatmah_invitations;

CREATE POLICY "Users can view relevant invitations" ON public.private_khatmah_invitations
  FOR SELECT
  USING (
    -- User is the one who sent the invitation
    invited_by = auth.uid() 
    -- OR invitation is sent to the user's email (case-insensitive comparison)
    OR LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    -- OR user is the creator of the khatmah
    OR EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );

-- 6. Add helpful comment
COMMENT ON POLICY "Users can view relevant invitations" ON public.private_khatmah_invitations IS 
'Allows users to view invitations they sent, received (by email), or for khatmahs they created. Uses case-insensitive email comparison.';
