-- =====================================================
-- DEBUGGING QUERIES - Run these to diagnose the issue
-- =====================================================

-- 1. Check if the member record exists
SELECT 
  id,
  khatmah_id,
  user_id,
  status,
  full_name,
  joined_at
FROM private_khatmah_members
WHERE user_id = '863a3d38-4dbc-4f17-8286-81adcad0e868';

-- 2. Check if the khatmah exists
SELECT 
  id,
  name,
  created_by,
  is_active,
  created_at
FROM private_khatmahs
WHERE id = '4e7425f1-613c-481f-a7ed-feda828dbf70';

-- 3. Test the SECURITY DEFINER function directly
SELECT * FROM get_user_khatmah_ids('863a3d38-4dbc-4f17-8286-81adcad0e868');

-- 4. Check current policies on private_khatmahs
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'private_khatmahs';

-- 5. Check current policies on private_khatmah_members
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'private_khatmah_members';

-- 6. Try to select the khatmah WITH RLS (simulating what the app does)
-- Note: This will use your current authenticated user
SELECT * FROM private_khatmahs 
WHERE id = '4e7425f1-613c-481f-a7ed-feda828dbf70';
