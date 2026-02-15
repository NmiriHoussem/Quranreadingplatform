-- =====================================================
-- FIX INFINITE RECURSION - ALLOW MEMBERS TO SEE EACH OTHER
-- =====================================================

-- Drop existing problematic policy and function
DROP POLICY IF EXISTS "Users can view khatmah members" ON public.private_khatmah_members;
DROP FUNCTION IF EXISTS is_khatmah_member(UUID, UUID);

-- Create a helper function that checks membership WITHOUT triggering RLS
CREATE OR REPLACE FUNCTION check_user_is_khatmah_member(khatmah_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  -- Temporarily disable RLS for this query
  SET LOCAL row_security = OFF;
  
  SELECT EXISTS (
    SELECT 1 
    FROM public.private_khatmah_members 
    WHERE khatmah_id = khatmah_uuid 
    AND user_id = user_uuid 
    AND status = 'active'
  ) INTO is_member;
  
  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the policy with proper membership checking
CREATE POLICY "Users can view khatmah members" ON public.private_khatmah_members
  FOR SELECT
  USING (
    -- User is the creator of this khatmah
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
    -- OR user is an active member of this khatmah (no recursion!)
    OR check_user_is_khatmah_member(khatmah_id, auth.uid())
  );
