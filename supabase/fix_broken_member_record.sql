-- =====================================================
-- MANUAL FIX: Update the broken member record
-- =====================================================

-- Fix the current broken member record for contact@ndev.digital
UPDATE private_khatmah_members
SET 
  user_id = '863a3d38-4dbc-4f17-8286-81adcad0e868',
  full_name = 'ndev',
  status = 'active',
  joined_at = NOW()
WHERE 
  id = '3163051e-8faf-4e22-bff2-1784307fa28f'
  AND khatmah_id = '4e7425f1-613c-481f-a7ed-feda828dbf70'
  AND email = 'contact@ndev.digital';

-- Verify the fix
SELECT 
  id,
  khatmah_id,
  user_id,
  email,
  status,
  full_name,
  joined_at
FROM private_khatmah_members
WHERE khatmah_id = '4e7425f1-613c-481f-a7ed-feda828dbf70';
