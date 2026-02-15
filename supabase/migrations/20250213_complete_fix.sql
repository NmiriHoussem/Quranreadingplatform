-- =====================================================
-- COMPLETE FIX FOR INFINITE RECURSION
-- =====================================================
-- Fix both private_khatmahs and private_khatmah_members policies
-- =====================================================

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view their khatmahs" ON public.private_khatmahs;
DROP POLICY IF EXISTS "Users can view khatmah members" ON public.private_khatmah_members;

-- Drop existing functions
DROP FUNCTION IF EXISTS is_khatmah_member(UUID, UUID);
DROP FUNCTION IF EXISTS check_user_is_khatmah_member(UUID, UUID);
DROP FUNCTION IF EXISTS get_khatmah_members_for_user(UUID);
DROP FUNCTION IF EXISTS get_user_khatmahs();

-- Create function to get user's khatmah IDs (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION get_user_khatmah_ids(p_user_id UUID)
RETURNS TABLE (khatmah_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT m.khatmah_id
  FROM public.private_khatmah_members m
  WHERE m.user_id = p_user_id
  AND m.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate private_khatmahs policy WITHOUT circular reference
CREATE POLICY "Users can view their khatmahs" ON public.private_khatmahs
  FOR SELECT
  USING (
    -- User is the creator
    created_by = auth.uid()
    -- OR khatmah is in user's khatmah list (using SECURITY DEFINER function)
    OR id IN (SELECT khatmah_id FROM get_user_khatmah_ids(auth.uid()))
  );

-- Recreate private_khatmah_members policy (simple, no circular reference)
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

-- Create function to get all members of a khatmah (for UI use)
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

  -- Return all members of this khatmah (bypasses RLS)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_khatmah_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_khatmah_members_for_user(UUID) TO authenticated;
