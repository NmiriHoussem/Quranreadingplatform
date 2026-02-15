-- =====================================================
-- ADD FULL NAME TO CREATOR TRIGGER
-- =====================================================
-- This migration updates the add_creator_as_member trigger
-- to automatically populate full_name from user_metadata
-- =====================================================

-- Update the function to include full_name from user_metadata
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.private_khatmah_members (
    khatmah_id, 
    user_id, 
    email, 
    full_name,
    status, 
    joined_at
  )
  SELECT 
    NEW.id, 
    NEW.created_by, 
    auth.users.email,
    COALESCE(
      auth.users.raw_user_meta_data->>'name',
      SPLIT_PART(auth.users.email, '@', 1)
    ),
    'active',
    NOW()
  FROM auth.users
  WHERE auth.users.id = NEW.created_by;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The trigger will now automatically set full_name when:
-- 1. A user creates a private khatmah (they become a member)
-- 2. Full name is pulled from user_metadata.name
-- 3. Falls back to email prefix if name not available
-- =====================================================
