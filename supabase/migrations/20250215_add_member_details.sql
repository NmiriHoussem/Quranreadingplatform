-- =====================================================
-- ADD MEMBER DETAILS AND PROGRESS TRACKING
-- =====================================================
-- This migration adds full name and progress tracking
-- to private khatmah members for unified progress display
-- =====================================================

-- 1. Add full_name and progress_data columns to private_khatmah_members
ALTER TABLE public.private_khatmah_members
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS progress_data JSONB DEFAULT '{"pagesRead": {}, "percentComplete": 0, "lastUpdated": null}'::jsonb;

-- 2. Add index for faster progress queries
CREATE INDEX IF NOT EXISTS idx_private_khatmah_members_progress 
  ON public.private_khatmah_members USING gin(progress_data);

-- 3. Update RLS policy to allow members to update their own progress
DROP POLICY IF EXISTS "Members can update their own progress" ON public.private_khatmah_members;
CREATE POLICY "Members can update their own progress" 
  ON public.private_khatmah_members
  FOR UPDATE
  USING (user_id = auth.uid());

-- 4. Add comment for documentation
COMMENT ON COLUMN public.private_khatmah_members.full_name IS 'Full name of the member for display in group progress';
COMMENT ON COLUMN public.private_khatmah_members.progress_data IS 'JSONB containing member reading progress: {"pagesRead": {}, "percentComplete": 0, "lastUpdated": "ISO8601"}';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
