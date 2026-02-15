-- =====================================================
-- FIX INFINITE RECURSION - ALTERNATIVE APPROACH
-- =====================================================
-- Use simple policy + helper function for member queries
-- =====================================================

-- Drop existing policies and functions
DROP POLICY IF EXISTS "Users can view khatmah members" ON public.private_khatmah_members;
DROP FUNCTION IF EXISTS is_khatmah_member(UUID, UUID);
DROP FUNCTION IF EXISTS check_user_is_khatmah_member(UUID, UUID);
DROP FUNCTION IF EXISTS get_khatmah_members_for_user(UUID);

-- Simple policy: Users can only see their OWN membership record OR if they're the creator
CREATE POLICY "Users can view khatmah members" ON public.private_khatmah_members
  FOR SELECT
  USING (
    -- User is viewing their own membership record
    user_id = auth.uid()
    -- OR user is the creator of this khatmah
    OR EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );

-- Create a SECURITY DEFINER function that returns all members of khatmahs the user belongs to
CREATE OR REPLACE FUNCTION get_khatmah_members_for_user(p_khatmah_id UUID)
RETURNS TABLE (
  id UUID,
  khatmah_id UUID,
  user_id UUID,
  email TEXT,
  status TEXT,
  joined_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if the user is a member or creator of this khatmah
  IF NOT EXISTS (
    SELECT 1 FROM public.private_khatmah_members
    WHERE khatmah_id = p_khatmah_id
    AND user_id = auth.uid()
    AND status = 'active'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.private_khatmahs
    WHERE id = p_khatmah_id
    AND created_by = auth.uid()
  ) THEN
    -- User is not authorized, return empty
    RETURN;
  END IF;

  -- Return all members of this khatmah (bypasses RLS because SECURITY DEFINER)
  RETURN QUERY
  SELECT 
    m.id,
    m.khatmah_id,
    m.user_id,
    m.email,
    m.status,
    m.joined_at,
    m.invited_at
  FROM public.private_khatmah_members m
  WHERE m.khatmah_id = p_khatmah_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_khatmah_members_for_user(UUID) TO authenticated;
