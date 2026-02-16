-- =====================================================
-- FIX: Private Khatmah Invitation Acceptance
-- =====================================================
-- This migration creates a secure database function to handle
-- invitation acceptance, bypassing RLS issues with email matching

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS accept_private_khatmah_invitation(uuid);

-- Create a secure function to accept invitations
-- SECURITY DEFINER allows it to bypass RLS policies
CREATE OR REPLACE FUNCTION accept_private_khatmah_invitation(invitation_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
  member_record RECORD;
  current_user_id uuid;
  current_user_email text;
  user_full_name text;
  result json;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  current_user_email := auth.email();
  
  -- Check authentication
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Get the invitation
  SELECT * INTO invitation_record
  FROM private_khatmah_invitations
  WHERE id = invitation_id_param
    AND status = 'pending';

  -- Check if invitation exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation not found or already processed'
    );
  END IF;

  -- Verify the invitation is for the current user (case-insensitive email match)
  IF LOWER(TRIM(invitation_record.email)) != LOWER(TRIM(current_user_email)) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation is not for this user'
    );
  END IF;

  -- Get user's full name from auth metadata
  SELECT COALESCE(
    raw_user_meta_data->>'name',
    SPLIT_PART(email, '@', 1),
    'User'
  ) INTO user_full_name
  FROM auth.users
  WHERE id = current_user_id;

  -- Update invitation status to 'accepted'
  UPDATE private_khatmah_invitations
  SET status = 'accepted'
  WHERE id = invitation_id_param;

  -- Update the member record (this is the critical part that was failing)
  -- We match by khatmah_id and email (case-insensitive)
  UPDATE private_khatmah_members
  SET 
    user_id = current_user_id,
    full_name = user_full_name,
    status = 'active',
    joined_at = NOW()
  WHERE khatmah_id = invitation_record.khatmah_id
    AND LOWER(TRIM(email)) = LOWER(TRIM(invitation_record.email))
    AND user_id IS NULL;

  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Member record not found or already claimed'
    );
  END IF;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'error', null,
    'khatmah_id', invitation_record.khatmah_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_private_khatmah_invitation(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION accept_private_khatmah_invitation IS 
  'Securely accepts a private khatmah invitation, bypassing RLS to ensure member record is updated';
