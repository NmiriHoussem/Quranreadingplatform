-- ========================================
-- QUICK FIX - Run this first to immediately fix the 403 error
-- ========================================

-- Enable RLS
ALTER TABLE public.private_khatmah_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.private_khatmah_invitations;

-- Create simple SELECT policy
CREATE POLICY "Users can view invitations" ON public.private_khatmah_invitations
  FOR SELECT
  USING (
    invited_by = auth.uid() 
    OR
    LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    OR
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );

-- Normalize emails
UPDATE public.private_khatmah_invitations 
SET email = LOWER(TRIM(email));

-- Check if it works
SELECT COUNT(*) as invitation_count
FROM public.private_khatmah_invitations
WHERE LOWER(TRIM(email)) = 'houssem.addin@gmail.com'
AND status = 'pending';
