-- =====================================================
-- FIX INFINITE RECURSION - SIMPLIFIED APPROACH
-- =====================================================
-- Remove the circular membership check entirely
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view khatmah members" ON public.private_khatmah_members;

-- Recreate with SIMPLE logic - no circular checks
CREATE POLICY "Users can view khatmah members" ON public.private_khatmah_members
  FOR SELECT
  USING (
    -- User is the creator of this khatmah
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
    -- OR user is viewing their own membership record (no recursion here)
    OR user_id = auth.uid()
  );
