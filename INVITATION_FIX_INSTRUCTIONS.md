# Fix for "Accept Invitation" RLS Error

## Problem
When users try to accept an invitation to a private khatmah, they get this error:
```
Error: new row violates row-level security policy for table "private_khatmah_members"
```

## Root Cause
The current RLS policy for `private_khatmah_members` table only allows updates where `user_id = auth.uid()`. However, when a user accepts an invitation:
1. A member record already exists with their email but `user_id = null` (created by the khatmah creator)
2. The user needs to "claim" this record by adding their `user_id`
3. The policy blocks this because `null ≠ auth.uid()`

## Solution
Run the following SQL migration in your Supabase SQL Editor:

```sql
-- =====================================================
-- FIX: Allow users to accept invitations
-- =====================================================
-- This fixes the RLS policy violation when users try to
-- accept invitations to private khatmahs.
-- =====================================================

-- Drop the old policy
DROP POLICY IF EXISTS "Users can update their membership" ON public.private_khatmah_members;

-- Create a new comprehensive UPDATE policy
CREATE POLICY "Users can update their membership" ON public.private_khatmah_members
  FOR UPDATE
  USING (
    -- User is updating their own active membership
    user_id = auth.uid()
    OR
    -- User is claiming a pending invitation sent to their email
    (
      user_id IS NULL 
      AND LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    )
  );

-- Add a comment for documentation
COMMENT ON POLICY "Users can update their membership" ON public.private_khatmah_members IS 
  'Allows users to update their own membership records, including claiming pending invitations sent to their email';
```

## How to Apply

1. Go to your Supabase Dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Create a "New query"
5. Copy and paste the SQL above
6. Click "Run" (or press Cmd/Ctrl + Enter)

## What This Does

The updated policy now allows two scenarios:
1. **Active members** can update their own records (user_id matches)
2. **Invited users** can "claim" pending invitations where their email matches (even if user_id is null)

This allows the invitation acceptance flow to work properly while maintaining security.

## Files Updated

- `/src/services/privateKhatmahService.ts` - Changed `upsert` to direct `UPDATE` in `acceptPrivateKhatmahInvitation()`
- `/supabase/migrations/20250216_fix_accept_invitation_rls.sql` - Created migration file for future reference

## Testing

After applying the migration:
1. Log in as a user who has a pending invitation
2. Go to the Reading Dashboard
3. Click "Accept" on a pending invitation
4. The invitation should be accepted successfully without any RLS errors
