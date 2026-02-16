-- =====================================================
-- FIX: Allow members to view private khatmahs they joined
-- =====================================================
-- The problem: After accepting an invitation, the member
-- record is created successfully, but users can't see the
-- khatmah details because the RLS policy on private_khatmahs
-- is not recognizing them as members.
--
-- The solution: Update the RLS policy to directly check the
-- private_khatmah_members table without relying on a function.
-- =====================================================

-- Drop the old policy
DROP POLICY IF EXISTS "Users can view their khatmahs" ON public.private_khatmahs;

-- Create a new direct policy without function dependency
CREATE POLICY "Users can view their khatmahs" ON public.private_khatmahs
  FOR SELECT
  USING (
    -- User is the creator
    created_by = auth.uid()
    OR
    -- OR user is an active member of this khatmah
    EXISTS (
      SELECT 1 
      FROM public.private_khatmah_members 
      WHERE khatmah_id = private_khatmahs.id 
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Add a comment for documentation
COMMENT ON POLICY "Users can view their khatmahs" ON public.private_khatmahs IS 
  'Allows users to view khatmahs they created or are active members of';
