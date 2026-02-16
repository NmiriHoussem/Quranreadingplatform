-- =====================================================
-- FIX: Allow users to accept invitations
-- =====================================================
-- This fixes the RLS policy violation when users try to
-- accept invitations to private khatmahs.
-- 
-- The problem: When a user accepts an invitation, they need
-- to update a member record that was created by the khatmah
-- creator. The existing "Users can update their membership" 
-- policy only allows updates where user_id = auth.uid(), 
-- but the pending invitation has user_id = null.
--
-- The solution: Add a policy that allows users to update
-- member records where their email matches, even if user_id
-- is currently null (claiming their invitation).
-- =====================================================

-- Drop the old policy
DROP POLICY IF EXISTS "Users can update their membership" ON public.private_khatmah_members;

-- Create a new comprehensive UPDATE policy
CREATE POLICY "Users can update their membership" ON public.private_khatmah_members
  FOR UPDATE
  USING (
    -- User is updating their own active membership
    user_id = auth.uid()
    OR
    -- User is claiming a pending invitation sent to their email
    (
      user_id IS NULL 
      AND LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    )
  );

-- Add a comment for documentation
COMMENT ON POLICY "Users can update their membership" ON public.private_khatmah_members IS 
  'Allows users to update their own membership records, including claiming pending invitations sent to their email';
