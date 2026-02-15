# 🔍 Private Khatmah Invitation Debugging Guide

## Quick Access

**Debug Page:** https://quranpartner.figma.site/debug-invitations  
**Production:** https://qurancircle.net/debug-invitations

## Setup Steps

### 1. Apply Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Normalize all emails to lowercase in existing invitations
UPDATE public.private_khatmah_invitations 
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

-- Normalize all emails in members table as well
UPDATE public.private_khatmah_members 
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

-- Fix RLS policy with case-insensitive comparison
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.private_khatmah_invitations;

CREATE POLICY "Users can view relevant invitations" ON public.private_khatmah_invitations
  FOR SELECT
  USING (
    -- User is the one who sent the invitation
    invited_by = auth.uid() 
    -- OR invitation is sent to the user's email (case-insensitive comparison)
    OR LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    -- OR user is the creator of the khatmah
    OR EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );
```

### 2. Access the Debug Page

1. Visit: https://qurancircle.net/debug-invitations (or https://quranpartner.figma.site/debug-invitations)
2. You must be logged in
3. Click **"Fetch Invitations"**
4. Open Browser Console (F12) to see detailed logs

## What the Debug Page Shows

### 1. Current User Info
- Email address
- User ID (UUID)

### 2. Database Statistics
- **Total Invitations**: All invitations in the system
- **Pending**: Invitations with status = 'pending'
- **For You**: Invitations matching your email
- **Total Khatmahs**: All private khatmahs created

### 3. Service Function Result
Shows what `getPendingInvitations()` returns:
- This is what the app UI actually sees
- Should match invitations sent to your email

### 4. Raw Database Query
Direct query results bypassing the service function:
- Shows all pending invitations (regardless of RLS)
- Useful for comparing what exists vs what the user can see

## Console Debug Logs

Look for these logs in your browser console (F12):

```
📧 getPendingInvitations - User email: houssem.addin@gmail.com
📧 getPendingInvitations - Query result: { invitations: [...], error: null }
📧 getPendingInvitations - Found X pending invitation(s)
📧 getPendingInvitations - No pending invitations found
📧 getPendingInvitations - RLS permission error, returning empty
```

## Test Scenarios

### Scenario 1: Create & Test Invitation

**As Creator (contact@ndev.digital):**
1. Go to Reading Dashboard
2. Click "Create Private Khatmah"
3. Add email: `houssem.addin@gmail.com`
4. Click Create
5. Note the khatmah ID in console

**As Invitee (houssem.addin@gmail.com):**
1. Log in
2. Visit `/debug-invitations`
3. Click "Fetch Invitations"
4. Should see the invitation in both sections

### Scenario 2: Check Database Directly

Run this query in Supabase SQL Editor:

```sql
-- See all pending invitations
SELECT 
  i.id,
  i.email as invitation_email,
  i.status as invitation_status,
  i.invited_at,
  k.name as khatmah_name,
  k.duration,
  creator.email as creator_email
FROM public.private_khatmah_invitations i
JOIN public.private_khatmahs k ON i.khatmah_id = k.id
JOIN auth.users creator ON k.created_by = creator.id
WHERE i.status = 'pending'
ORDER BY i.invited_at DESC;
```

### Scenario 3: Test Email Case Sensitivity

Run the "Test Email Matching" button on the debug page. Check console for:
- Exact match
- Lowercase match
- iLike match

All three should return the same results after migration.

## Common Issues & Solutions

### Issue 1: "For You" count is 0 but "Pending" count > 0

**Problem:** RLS policy not matching your email  
**Solution:**
1. Check email casing in auth.users vs invitations table
2. Re-run the normalization SQL
3. Verify RLS policy uses LOWER(TRIM(...))

### Issue 2: Service returns empty but Raw query shows data

**Problem:** RLS policy too restrictive  
**Solution:**
1. Check the user is logged in
2. Verify auth.uid() matches expected user
3. Test RLS policy manually:

```sql
-- Run as the invited user
SELECT * FROM private_khatmah_invitations 
WHERE LOWER(TRIM(email)) = LOWER(TRIM('houssem.addin@gmail.com'))
AND status = 'pending';
```

### Issue 3: Console shows "RLS permission error"

**Problem:** User doesn't have permission to view invitations  
**Solution:**
1. Re-apply the RLS policy from migration
2. Make sure user is authenticated
3. Check if email in invitation exactly matches auth.users email

### Issue 4: Invitation exists but banner doesn't show

**Problem:** Frontend not polling or reading invitations  
**Solution:**
1. Check ReadingDashboard component loads invitations
2. Verify `useEffect` for `loadPendingInvitations` runs
3. Check state management in component

## Manual Testing SQL Queries

### Check specific user's invitations
```sql
-- Replace with actual email
SELECT * FROM private_khatmah_invitations 
WHERE LOWER(TRIM(email)) = 'houssem.addin@gmail.com'
AND status = 'pending';
```

### Check RLS policy
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'private_khatmah_invitations';
```

### Simulate user query (as admin)
```sql
-- This shows what a user SHOULD see
-- Replace user_id with actual UUID
SET LOCAL role postgres;
SELECT * FROM private_khatmah_invitations
WHERE LOWER(TRIM(email)) = (
  SELECT LOWER(TRIM(email)) 
  FROM auth.users 
  WHERE id = 'USER_UUID_HERE'
);
```

## Success Criteria

✅ **Database Stats** show correct counts  
✅ **Service Function** returns expected invitations  
✅ **Raw Query** matches Service Function result  
✅ **Console logs** show email matching correctly  
✅ **Invitation banner** appears in Reading Dashboard  

## Files Changed

- ✅ `/src/app/components/DebugInvitations.tsx` - New debug page
- ✅ `/src/app/App.tsx` - Added route `/debug-invitations`
- ✅ `/supabase/migrations/20250215_debug_invitations.sql` - Migration
- ✅ `/src/services/privateKhatmahService.ts` - Already has debug logs

## Next Steps After Verification

Once invitations are showing correctly:

1. **Remove debug page** (or keep for future debugging)
2. **Clean up console logs** in privateKhatmahService.ts
3. **Test accept/decline flow** thoroughly
4. **Monitor production** for any edge cases

## Support

If issues persist:
1. Screenshot the debug page
2. Copy console logs (📧 entries)
3. Export SQL query results
4. Check Supabase logs in Dashboard

This will help diagnose exactly where the issue is occurring.
