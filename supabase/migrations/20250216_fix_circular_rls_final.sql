-- =====================================================
-- COMPLETE FIX: Break circular RLS dependency
-- =====================================================
-- This fixes the infinite recursion by using SECURITY DEFINER
-- functions that bypass RLS for membership checks
-- =====================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their khatmahs" ON public.private_khatmahs;
DROP POLICY IF EXISTS "Users can view khatmah members" ON public.private_khatmah_members;

-- Drop old function if exists
DROP FUNCTION IF EXISTS get_user_khatmah_ids(UUID);

-- Create a SECURITY DEFINER function to get user's khatmah IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_khatmah_ids(p_user_id UUID)
RETURNS TABLE (khatmah_id UUID) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT m.khatmah_id
  FROM private_khatmah_members m
  WHERE m.user_id = p_user_id
  AND m.status = 'active';
END;
$$;

-- Create a SECURITY DEFINER function to check if user created a khatmah (bypasses RLS)
CREATE OR REPLACE FUNCTION is_khatmah_creator(p_khatmah_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM private_khatmahs
    WHERE id = p_khatmah_id
    AND created_by = p_user_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_khatmah_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_khatmah_creator(UUID, UUID) TO authenticated;

-- Create policy for private_khatmahs (uses SECURITY DEFINER function - no recursion)
CREATE POLICY "Users can view their khatmahs" ON public.private_khatmahs
  FOR SELECT
  USING (
    -- User is the creator
    created_by = auth.uid()
    OR
    -- OR khatmah ID is in user's member list (using SECURITY DEFINER function)
    id IN (SELECT khatmah_id FROM get_user_khatmah_ids(auth.uid()))
  );

-- Create policy for private_khatmah_members (simple - no circular reference)
CREATE POLICY "Users can view khatmah members" ON public.private_khatmah_members
  FOR SELECT
  USING (
    -- User is viewing their own membership record (no table lookup needed)
    user_id = auth.uid()
    OR
    -- OR user is the creator of this khatmah (using SECURITY DEFINER function)
    is_khatmah_creator(khatmah_id, auth.uid())
  );

-- Add comments
COMMENT ON FUNCTION get_user_khatmah_ids(UUID) IS 
  'Returns khatmah IDs where user is an active member. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

COMMENT ON FUNCTION is_khatmah_creator(UUID, UUID) IS 
  'Checks if user created a khatmah. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

COMMENT ON POLICY "Users can view their khatmahs" ON public.private_khatmahs IS 
  'Allows users to view khatmahs they created or are active members of';

COMMENT ON POLICY "Users can view khatmah members" ON public.private_khatmah_members IS 
  'Allows users to view their own membership records and members of khatmahs they created';