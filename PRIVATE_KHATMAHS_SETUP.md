# Private Khatmahs Setup Guide

This guide will help you set up the private khatmahs feature in your Supabase database.

## Database Setup

### Step 1: Run the Migration SQL

In your Supabase Dashboard:

1. Go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `/supabase/migrations/20250213_private_khatmahs.sql`
4. Click **Run** to execute the migration

This will create:
- `private_khatmahs` table
- `private_khatmah_members` table
- `private_khatmah_invitations` table
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic member addition

### Step 2: Verify Tables

After running the migration, verify the tables were created:

```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'private_khatmah%';
```

You should see:
- `private_khatmahs`
- `private_khatmah_members`
- `private_khatmah_invitations`

### Step 3: Test the Feature

1. **Sign up/Log in** to your app
2. Navigate to **Reading Dashboard**
3. Switch to the **Private Khatmahs** tab
4. Click **Create Private Khatmah**
5. Fill in:
   - Select a duration (7, 10, 15, 30, 60, or 90 days)
   - Enter a group name
   - Add member emails (optional)
6. Click **Create Khatmah**

## Features

### For Creators
- Create private khatmahs with custom durations
- Invite members via email
- Manage members (add/remove)
- Track group progress
- Delete khatmahs (soft delete)

### For Members
- Receive email invitations
- Accept/decline invitations
- View khatmah details
- Track personal progress
- Leave khatmahs

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only see khatmahs they created or are members of
- Only creators can add/remove members
- Only creators can delete their khatmahs
- Members can update their own status

## API Functions

The following functions are available in `/src/services/privateKhatmahService.ts`:

- `createPrivateKhatmah()` - Create a new private khatmah
- `getPrivateKhatmahs()` - Get all khatmahs for current user
- `getPrivateKhatmahById()` - Get a specific khatmah
- `addMembersToPrivateKhatmah()` - Add new members
- `removeMemberFromPrivateKhatmah()` - Remove a member
- `deletePrivateKhatmah()` - Soft delete a khatmah
- `getPendingInvitations()` - Get invitations for current user
- `acceptPrivateKhatmahInvitation()` - Accept an invitation
- `declinePrivateKhatmahInvitation()` - Decline an invitation

## Future Enhancements

- [ ] Email notifications for invitations
- [ ] In-app notification system
- [ ] Progress sharing within group
- [ ] Group chat/comments
- [ ] Group leaderboard
- [ ] Export khatmah data
- [ ] Recurring khatmahs
- [ ] Khatmah templates

## Troubleshooting

### Issue: "User not authenticated"
**Solution**: Make sure you're logged in before creating a private khatmah

### Issue: "Permission denied"
**Solution**: Check that RLS policies are properly set up

### Issue: Tables not created
**Solution**: Run the migration SQL again in Supabase SQL Editor

### Issue: Can't see created khatmahs
**Solution**: 
1. Check browser console for errors
2. Verify user is authenticated
3. Check RLS policies in Supabase

## Support

For issues or questions, check:
1. Browser console for errors
2. Supabase logs for database errors
3. Network tab for API call failures
