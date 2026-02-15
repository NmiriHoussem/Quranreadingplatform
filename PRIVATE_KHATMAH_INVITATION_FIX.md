# Fix Private Khatmah Invitations Not Showing

## Problem
User `contact@ndev.digital` created a private khatmah and invited `houssem.addin@gmail.com`, but when logging in as `houssem.addin@gmail.com`, no invitation notification banner appears on the Reading Dashboard.

## Root Causes

### 1. **Email Case Sensitivity Issue**
The invitation system stores emails in lowercase, but the RLS policy might not be doing case-insensitive comparison properly.

### 2. **Possible Data Corruption**
If emails were stored with different casing, the query won't match.

### 3. **RLS Policy Issue**
The Row Level Security policy might not be allowing the invited user to see their own invitations.

## Solution

### Step 1: Apply the Database Migration

Run the migration file `/supabase/migrations/20250215_debug_invitations.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Paste the contents of the migration file
3. Click "Run"

This migration will:
- Normalize all existing emails to lowercase
- Fix the RLS policy to use case-insensitive email comparison
- Add debugging comments

### Step 2: Verify the Data

Run this query in Supabase SQL Editor to check pending invitations:

```sql
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

**Expected Result:** You should see an invitation for `houssem.addin@gmail.com` with status='pending'

### Step 3: Check User Email in Auth

Verify the exact email stored for the user:

```sql
SELECT id, email 
FROM auth.users 
WHERE email ILIKE '%houssem.addin%';
```

Make sure it matches exactly (case-insensitive) with the invitation email.

### Step 4: Test the Application

1. Deploy the updated code (with the new console.log debugging)
2. Log in as `houssem.addin@gmail.com`
3. Go to Reading Dashboard → Private Khatmahs tab
4. Open browser console (F12) and look for logs starting with "📧"
5. You should see:
   ```
   📧 getPendingInvitations - User email: houssem.addin@gmail.com
   📧 getPendingInvitations - Query result: { invitations: [...], error: null }
   📧 getPendingInvitations - Found 1 pending invitation(s)
   ```

### Step 5: If Still Not Working - Manual Data Fix

If the invitation is still not showing, manually update the database:

```sql
-- Check if invitation exists
SELECT * FROM public.private_khatmah_invitations 
WHERE LOWER(email) = 'houssem.addin@gmail.com';

-- If it exists but with wrong status, update it:
UPDATE public.private_khatmah_invitations 
SET status = 'pending'
WHERE LOWER(email) = 'houssem.addin@gmail.com'
AND id = 'YOUR_INVITATION_ID_HERE';

-- Also check the members table
SELECT * FROM public.private_khatmah_members 
WHERE LOWER(email) = 'houssem.addin@gmail.com';

-- Update member status to pending if needed
UPDATE public.private_khatmah_members 
SET status = 'pending', user_id = NULL, joined_at = NULL
WHERE LOWER(email) = 'houssem.addin@gmail.com'
AND status != 'pending';
```

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Invitations show up in SQL query
- [ ] User email matches invitation email (case-insensitive)
- [ ] Console logs show invitation being fetched
- [ ] Banner appears on Reading Dashboard
- [ ] Accept button works
- [ ] After accepting, khatmah appears in the list

## Additional Debugging

If issues persist, check:

1. **RLS Policies Active**: 
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'private_khatmah_invitations';
   ```

2. **User Session**: Make sure the user is properly authenticated
   - Check in browser console: `localStorage.getItem('quran_session')`

3. **Network Tab**: Check if the Supabase API call is being made and what it returns

## Why This Happens

The issue occurs because:
1. Email addresses can have different casing (John@email.com vs john@email.com)
2. PostgreSQL's default equality operator (=) is case-sensitive
3. The original RLS policy didn't use `LOWER()` for case-insensitive comparison
4. When creating invitations, emails are stored as lowercase
5. But when querying, the auth.users email might have different casing

The fix ensures all comparisons are case-insensitive by using `LOWER(TRIM())` on both sides.
