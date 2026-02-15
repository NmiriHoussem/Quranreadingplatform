# 🚨 FIXING THE 403 ERROR - Step by Step

## Problem Identified

The console shows **403 Forbidden** errors when trying to access `private_khatmah_invitations`:
```
📧 getPendingInvitations - RLS permission error, returning empty
```

This means **Row Level Security (RLS)** policies are blocking access.

## Quick Fix (5 minutes)

### Step 1: Go to Supabase SQL Editor

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New query**

### Step 2: Run the Quick Fix

Copy and paste this entire script:

```sql
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
```

Click **Run** (or press Ctrl+Enter)

### Step 3: Check the Result

The last query should show you:
- `invitation_count: 0` = No invitations exist yet (need to create one)
- `invitation_count: 1+` = Invitations exist and should now be visible

### Step 4: Test in the App

1. Go back to: https://quranpartner.figma.site/debug-invitations
2. Click **"Fetch Invitations"** again
3. You should now see invitations (or "0 For You" if none exist)
4. **No more 403 errors!**

## If You Still See 0 Invitations

That means no invitations have been created yet. Let's create a test one:

### Step 5: Create Test Invitation

First, get the necessary IDs:

```sql
-- Get creator user ID
SELECT id, email FROM auth.users WHERE email = 'contact@ndev.digital';
-- Copy the 'id' value

-- Get or create a khatmah
SELECT id, name FROM public.private_khatmahs ORDER BY created_at DESC LIMIT 1;
-- Copy the 'id' value
```

Then create the invitation (replace the UUIDs):

```sql
-- Replace KHATMAH_ID_HERE and CREATOR_USER_ID_HERE with actual values from above
INSERT INTO public.private_khatmah_invitations (
  khatmah_id,
  email,
  invited_by,
  status
) VALUES (
  'KHATMAH_ID_HERE',  -- Khatmah ID from above
  'houssem.addin@gmail.com',
  'CREATOR_USER_ID_HERE',  -- Creator's user ID from above
  'pending'
);

-- Also add to members table
INSERT INTO public.private_khatmah_members (
  khatmah_id,
  email,
  status
) VALUES (
  'KHATMAH_ID_HERE',  -- Same khatmah ID
  'houssem.addin@gmail.com',
  'pending'
);
```

### Step 6: Verify

```sql
-- Check invitations for houssem.addin@gmail.com
SELECT 
  i.id,
  i.email,
  i.status,
  k.name as khatmah_name,
  creator.email as created_by
FROM public.private_khatmah_invitations i
JOIN public.private_khatmahs k ON i.khatmah_id = k.id
JOIN auth.users creator ON k.created_by = creator.id
WHERE LOWER(TRIM(i.email)) = 'houssem.addin@gmail.com';
```

This should now show your test invitation!

## Alternative: Create via UI

If SQL feels complicated, create an invitation through the UI:

1. Login as **contact@ndev.digital**
2. Go to **Reading Dashboard**
3. Click **"Create Private Khatmah"**
4. Enter khatmah name and duration
5. Add email: **houssem.addin@gmail.com**
6. Click **Create**

Then login as **houssem.addin@gmail.com** and check the debug page.

## Complete Fix (Optional - All Policies)

If you want to set up ALL RLS policies (INSERT, UPDATE, DELETE), run the complete migration:

File: `/supabase/migrations/20250215_fix_rls_complete.sql`

This includes:
- SELECT policy (view invitations)
- INSERT policy (create invitations)
- UPDATE policy (accept/decline invitations)

## Expected Results After Fix

### ✅ In Console:
```
📧 getPendingInvitations - User email: houssem.addin@gmail.com
📧 getPendingInvitations - Query result: { invitations: [...], error: null }
📧 getPendingInvitations - Found 1 pending invitation(s)
```

### ✅ In Debug Page:
- Database Statistics shows correct counts
- Service Function Result shows invitations
- No 403 errors in console

### ✅ In Reading Dashboard:
- Invitation banner appears at top
- Shows khatmah details
- Accept/Decline buttons work

## Troubleshooting

### Still Getting 403?
- Make sure you ran the SQL as shown (copy-paste exactly)
- Check you're logged in as the correct user
- Try logging out and back in
- Clear browser cache

### No Invitations Showing?
- Run Step 5 to create a test invitation
- Verify email matches exactly: `houssem.addin@gmail.com`
- Check the verification query in Step 6

### Can't Create Invitation via UI?
- Check INSERT policy exists (run complete migration)
- Verify you're logged in as the khatmah creator
- Check browser console for different errors

## Files Reference

- **Quick Fix:** `/supabase/QUICK_FIX_RLS.sql`
- **Complete Fix:** `/supabase/migrations/20250215_fix_rls_complete.sql`
- **Debug Guide:** `/DEBUG_INVITATIONS_GUIDE.md`

## Next Steps

1. ✅ Run the Quick Fix SQL
2. ✅ Test the debug page
3. ✅ Create test invitation (if needed)
4. ✅ Verify in Reading Dashboard
5. ✅ Test accept/decline flow
6. ✅ Remove debug page (optional)

The 403 error should be gone after Step 1! 🎉
