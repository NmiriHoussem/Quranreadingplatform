-- =====================================================
-- FIX INFINITE RECURSION IN PRIVATE KHATMAH POLICIES
-- =====================================================
-- Run this to fix the recursion error
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view khatmah members" ON public.private_khatmah_members;

-- Create a helper function that bypasses RLS to check membership
CREATE OR REPLACE FUNCTION is_khatmah_member(khatmah_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.private_khatmah_members 
    WHERE khatmah_id = khatmah_uuid 
    AND user_id = user_uuid 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the policy WITHOUT recursion using the helper function
CREATE POLICY "Users can view khatmah members" ON public.private_khatmah_members
  FOR SELECT
  USING (
    -- User is the creator of this khatmah
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
    -- OR user is viewing their own membership record
    OR user_id = auth.uid()
    -- OR user is an active member (using SECURITY DEFINER function to bypass RLS)
    OR is_khatmah_member(khatmah_id, auth.uid())
  );
