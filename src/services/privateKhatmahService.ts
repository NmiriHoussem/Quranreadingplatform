// Private Khatmah Service - Supabase Integration
// Handles creating, managing, and syncing private khatmahs with the database

import { supabase } from '../lib/supabase';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getCurrentSession } from './authService';
import { getCachedData, setCachedData, CACHE_KEYS, areDataEqual } from './cacheService';

const supabaseUrl = `https://${projectId}.supabase.co`;
const serverUrl = `${supabaseUrl}/functions/v1/make-server-bf07b5b1`;

export interface PrivateKhatmah {
  id: string;
  name: string;
  duration: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PrivateKhatmahMember {
  id: string;
  khatmah_id: string;
  user_id: string | null;
  email: string;
  status: 'pending' | 'active' | 'declined';
  joined_at: string | null;
  invited_at: string;
}

export interface PrivateKhatmahInvitation {
  id: string;
  khatmah_id: string;
  email: string;
  invited_by: string;
  invited_at: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface CreatePrivateKhatmahData {
  name: string;
  duration: number;
  memberEmails: string[];
}

// Create a new private khatmah
export async function createPrivateKhatmah(
  data: CreatePrivateKhatmahData
): Promise<{ khatmah: PrivateKhatmah | null; error: string | null }> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { khatmah: null, error: 'User not authenticated' };
    }

    // Get user email for member record
    const { data: profile } = await supabase.auth.getUser();
    const userEmail = profile?.user?.email;

    if (!userEmail) {
      return { khatmah: null, error: 'User email not found' };
    }

    // Create the khatmah
    const { data: khatmah, error: khatmahError } = await supabase
      .from('private_khatmahs')
      .insert({
        name: data.name,
        duration: data.duration,
        created_by: user.id,
      })
      .select()
      .single();

    if (khatmahError) {
      console.error('Error creating private khatmah:', khatmahError);
      return { khatmah: null, error: khatmahError.message };
    }

    // Add the creator as an active member
    if (khatmah) {
      // Get full name from user metadata
      const fullName = profile?.user?.user_metadata?.name || userEmail.split('@')[0];
      
      const { error: creatorMemberError } = await supabase
        .from('private_khatmah_members')
        .upsert({
          khatmah_id: khatmah.id,
          user_id: user.id,
          email: userEmail.toLowerCase().trim(),
          full_name: fullName,
          status: 'active',
          joined_at: new Date().toISOString(),
        }, {
          onConflict: 'khatmah_id,email',
          ignoreDuplicates: false
        });

      if (creatorMemberError) {
        console.error('Error adding creator as member:', creatorMemberError);
        // Don't fail the khatmah creation, just log the error
      }
    }

    // Send invitations to members
    if (data.memberEmails.length > 0 && khatmah) {
      // Filter out the creator's email from member emails to avoid duplicates
      const filteredMemberEmails = data.memberEmails.filter(
        email => email.toLowerCase().trim() !== userEmail.toLowerCase().trim()
      );

      if (filteredMemberEmails.length > 0) {
        const invitations = filteredMemberEmails.map(email => ({
          khatmah_id: khatmah.id,
          email: email.toLowerCase().trim(),
          invited_by: user.id,
        }));

        const { error: invitationError } = await supabase
          .from('private_khatmah_invitations')
          .insert(invitations);

        if (invitationError) {
          console.error('Error creating invitations:', invitationError);
          // Don't fail the khatmah creation, just log the error
        }

        // Also add to members table as pending
        const members = filteredMemberEmails.map(email => ({
          khatmah_id: khatmah.id,
          email: email.toLowerCase().trim(),
          status: 'pending' as const,
        }));

        const { error: memberError } = await supabase
          .from('private_khatmah_members')
          .insert(members);

        if (memberError) {
          console.error('Error adding members:', memberError);
        }
      }
    }

    return { khatmah, error: null };
  } catch (error) {
    console.error('Error in createPrivateKhatmah:', error);
    return { khatmah: null, error: 'Failed to create private khatmah' };
  }
}

// Get all private khatmahs for current user
export async function getPrivateKhatmahs(): Promise<{
  khatmahs: (PrivateKhatmah & { members?: PrivateKhatmahMember[] })[];
  error: string | null;
}> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { khatmahs: [], error: 'User not authenticated' };
    }

    console.log('🔍 getPrivateKhatmahs - Fetching for user:', user.id);

    // Get khatmahs where user is the creator OR a member in parallel
    const [createdResult, memberResult] = await Promise.all([
      supabase
        .from('private_khatmahs')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('private_khatmah_members')
        .select('khatmah_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
    ]);

    const { data: createdKhatmahs, error: createdError } = createdResult;
    const { data: memberKhatmahIds, error: memberError } = memberResult;

    console.log('🔍 getPrivateKhatmahs - Created khatmahs:', createdKhatmahs?.length || 0);
    console.log('🔍 getPrivateKhatmahs - Member khatmah IDs:', memberKhatmahIds?.length || 0, memberKhatmahIds);

    if (createdError) {
      console.error('Error fetching created private khatmahs:', createdError);
    }

    if (memberError) {
      console.error('Error fetching member khatmahs:', memberError);
    }

    // Fetch full khatmah details for member khatmahs
    let memberKhatmahs: PrivateKhatmah[] = [];
    if (memberKhatmahIds && memberKhatmahIds.length > 0) {
      const khatmahIds = memberKhatmahIds.map(m => m.khatmah_id);
      
      const { data: memberKhatmahsData, error: memberKhatmahsError } = await supabase
        .from('private_khatmahs')
        .select('*')
        .in('id', khatmahIds)
        .eq('is_active', true);

      console.log('🔍 getPrivateKhatmahs - Member khatmah details:', memberKhatmahsData?.length || 0);

      if (memberKhatmahsError) {
        console.error('Error fetching member khatmah details:', memberKhatmahsError);
      } else {
        memberKhatmahs = memberKhatmahsData || [];
      }
    }

    // Combine created and member khatmahs, removing duplicates
    const allKhatmahsMap = new Map<string, PrivateKhatmah>();
    
    if (createdKhatmahs) {
      createdKhatmahs.forEach(k => allKhatmahsMap.set(k.id, k));
    }
    
    memberKhatmahs.forEach(k => allKhatmahsMap.set(k.id, k));

    const allKhatmahs = Array.from(allKhatmahsMap.values());

    console.log('🔍 getPrivateKhatmahs - Total khatmahs:', allKhatmahs.length);

    if (allKhatmahs.length === 0) {
      return { khatmahs: [], error: null };
    }

    // Fetch ALL members for ALL khatmahs in ONE query
    const khatmahIds = allKhatmahs.map(k => k.id);
    const { data: allMembers, error: allMembersError } = await supabase
      .from('private_khatmah_members')
      .select('id, khatmah_id, user_id, email, status, joined_at, invited_at')
      .in('khatmah_id', khatmahIds);

    if (allMembersError) {
      console.warn('Could not fetch members (RLS policy issue):', allMembersError);
    }

    // Group members by khatmah_id
    const membersByKhatmah = new Map<string, PrivateKhatmahMember[]>();
    (allMembers || []).forEach((member: any) => {
      if (!membersByKhatmah.has(member.khatmah_id)) {
        membersByKhatmah.set(member.khatmah_id, []);
      }
      membersByKhatmah.get(member.khatmah_id)!.push(member);
    });

    // Attach members to their khatmahs
    const khatmahsWithMembers = allKhatmahs.map(khatmah => ({
      ...khatmah,
      members: membersByKhatmah.get(khatmah.id) || []
    }));

    return { khatmahs: khatmahsWithMembers, error: null };
  } catch (error) {
    console.error('Error in getPrivateKhatmahs:', error);
    return { khatmahs: [], error: 'Failed to fetch private khatmahs' };
  }
}

// Get a specific private khatmah by ID
export async function getPrivateKhatmahById(
  khatmahId: string
): Promise<{ khatmah: (PrivateKhatmah & { members?: PrivateKhatmahMember[] }) | null; error: string | null }> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { khatmah: null, error: 'User not authenticated' };
    }

    const { data: khatmah, error } = await supabase
      .from('private_khatmahs')
      .select(`
        *,
        members:private_khatmah_members(*)
      `)
      .eq('id', khatmahId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching private khatmah:', error);
      return { khatmah: null, error: error.message };
    }

    // If no khatmah found, return a more helpful error
    if (!khatmah) {
      return { khatmah: null, error: 'Private khatmah not found or you do not have access to it' };
    }

    return { khatmah, error: null };
  } catch (error) {
    console.error('Error in getPrivateKhatmahById:', error);
    return { khatmah: null, error: 'Failed to fetch private khatmah' };
  }
}

// Add members to a private khatmah
export async function addMembersToPrivateKhatmah(
  khatmahId: string,
  emails: string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if user is the creator
    const { data: khatmah, error: khatmahError } = await supabase
      .from('private_khatmahs')
      .select('created_by')
      .eq('id', khatmahId)
      .single();

    if (khatmahError || !khatmah) {
      return { success: false, error: 'Khatmah not found' };
    }

    if (khatmah.created_by !== user.id) {
      return { success: false, error: 'Only the creator can add members' };
    }

    // Add invitations
    const invitations = emails.map(email => ({
      khatmah_id: khatmahId,
      email: email.toLowerCase().trim(),
      invited_by: user.id,
    }));

    const { error: invitationError } = await supabase
      .from('private_khatmah_invitations')
      .insert(invitations);

    if (invitationError) {
      console.error('Error creating invitations:', invitationError);
      return { success: false, error: invitationError.message };
    }

    // Add to members table
    const members = emails.map(email => ({
      khatmah_id: khatmahId,
      email: email.toLowerCase().trim(),
      status: 'pending' as const,
    }));

    const { error: memberError } = await supabase
      .from('private_khatmah_members')
      .insert(members);

    if (memberError) {
      console.error('Error adding members:', memberError);
      return { success: false, error: memberError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in addMembersToPrivateKhatmah:', error);
    return { success: false, error: 'Failed to add members' };
  }
}

// Remove a member from a private khatmah
export async function removeMemberFromPrivateKhatmah(
  khatmahId: string,
  memberId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if user is the creator
    const { data: khatmah, error: khatmahError } = await supabase
      .from('private_khatmahs')
      .select('created_by')
      .eq('id', khatmahId)
      .single();

    if (khatmahError || !khatmah) {
      return { success: false, error: 'Khatmah not found' };
    }

    if (khatmah.created_by !== user.id) {
      return { success: false, error: 'Only the creator can remove members' };
    }

    // Remove member
    const { error } = await supabase
      .from('private_khatmah_members')
      .delete()
      .eq('id', memberId)
      .eq('khatmah_id', khatmahId);

    if (error) {
      console.error('Error removing member:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in removeMemberFromPrivateKhatmah:', error);
    return { success: false, error: 'Failed to remove member' };
  }
}

// Delete a private khatmah
export async function deletePrivateKhatmah(
  khatmahId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('private_khatmahs')
      .update({ is_active: false })
      .eq('id', khatmahId)
      .eq('created_by', user.id);

    if (error) {
      console.error('Error deleting private khatmah:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in deletePrivateKhatmah:', error);
    return { success: false, error: 'Failed to delete private khatmah' };
  }
}

// Get pending invitations for current user
export async function getPendingInvitations(): Promise<{
  invitations: (PrivateKhatmahInvitation & { khatmah?: PrivateKhatmah })[];
  error: string | null;
}> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { invitations: [], error: null }; // Return empty for unauthenticated users
    }

    const { data: profile } = await supabase.auth.getUser();
    const userEmail = profile?.user?.email;

    console.log('📧 getPendingInvitations - User email:', userEmail);

    if (!userEmail) {
      return { invitations: [], error: null }; // Return empty if no email
    }

    // Try to fetch invitations - if there's a permission error, just return empty
    const { data: invitations, error } = await supabase
      .from('private_khatmah_invitations')
      .select('id, khatmah_id, email, invited_at, status')
      .eq('email', userEmail.toLowerCase())
      .eq('status', 'pending')
      .order('invited_at', { ascending: false });

    console.log('📧 getPendingInvitations - Query result:', { invitations, error });

    if (error) {
      // If it's a permission error, silently return empty (RLS policy issue)
      if (error.code === '42501') {
        console.log('📧 getPendingInvitations - RLS permission error, returning empty');
        return { invitations: [], error: null };
      }
      console.error('Error fetching invitations:', error);
      return { invitations: [], error: error.message };
    }

    // If no invitations, return early
    if (!invitations || invitations.length === 0) {
      console.log('📧 getPendingInvitations - No pending invitations found');
      return { invitations: [], error: null };
    }

    console.log('📧 getPendingInvitations - Found', invitations.length, 'pending invitation(s)');

    // Then fetch khatmah details separately for each invitation
    const invitationsWithKhatmahs = await Promise.all(
      invitations.map(async (invitation) => {
        try {
          const { data: khatmah } = await supabase
            .from('private_khatmahs')
            .select('id, name, duration, created_at, is_active')
            .eq('id', invitation.khatmah_id)
            .single();
          
          return {
            ...invitation,
            khatmah: khatmah || undefined
          };
        } catch (err) {
          console.error('Error fetching khatmah for invitation:', err);
          return {
            ...invitation,
            khatmah: undefined
          };
        }
      })
    );

    return { invitations: invitationsWithKhatmahs, error: null };
  } catch (error) {
    console.error('Error in getPendingInvitations:', error);
    // Return empty array instead of error to prevent UI issues
    return { invitations: [], error: null };
  }
}

// Accept a private khatmah invitation
export async function acceptPrivateKhatmahInvitation(
  invitationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log('🔍 Accepting invitation:', invitationId);

    // Use the secure database function to handle acceptance
    // This bypasses RLS issues with email matching
    const { data, error } = await supabase.rpc('accept_private_khatmah_invitation', {
      invitation_id_param: invitationId
    });

    console.log('🔍 Database function result:', { data, error });

    if (error) {
      console.error('❌ Error calling accept function:', error);
      return { success: false, error: error.message };
    }

    // The function returns a JSON object with success/error
    if (data && typeof data === 'object') {
      if (data.success) {
        console.log('✅ Invitation accepted successfully!');
        return { success: true, error: null };
      } else {
        console.error('❌ Function returned error:', data.error);
        return { success: false, error: data.error || 'Failed to accept invitation' };
      }
    }

    return { success: false, error: 'Unexpected response from database' };
  } catch (error) {
    console.error('Error in acceptPrivateKhatmahInvitation:', error);
    return { success: false, error: 'Failed to accept invitation' };
  }
}

// Decline a private khatmah invitation
export async function declinePrivateKhatmahInvitation(
  invitationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Update invitation status
    const { data: invitation, error: invitationError } = await supabase
      .from('private_khatmah_invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId)
      .select()
      .single();

    if (invitationError || !invitation) {
      console.error('Error declining invitation:', invitationError);
      return { success: false, error: invitationError?.message || 'Invitation not found' };
    }

    // Update member status
    const { error: memberError } = await supabase
      .from('private_khatmah_members')
      .update({ status: 'declined' })
      .eq('khatmah_id', invitation.khatmah_id)
      .eq('email', invitation.email);

    if (memberError) {
      console.error('Error updating member status:', memberError);
      // Don't fail if member update fails
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in declinePrivateKhatmahInvitation:', error);
    return { success: false, error: 'Failed to decline invitation' };
  }
}

// ===== PROGRESS SYNC FUNCTIONS =====

// Sync member progress to Supabase
export async function syncMemberProgress(
  khatmahId: string,
  progressData: {
    pagesRead: { [key: string]: { completed: boolean; timestamp: string } };
    percentComplete: number;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      console.error('❌ Cannot sync: User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    console.log('💾 syncMemberProgress called:', {
      khatmahId,
      userId: user.id,
      pagesReadCount: Object.keys(progressData.pagesRead).length,
      percentComplete: progressData.percentComplete
    });

    // Sync progress to database
    const { error } = await supabase
      .from('private_khatmah_members')
      .update({
        progress_data: {
          pagesRead: progressData.pagesRead,
          percentComplete: progressData.percentComplete,
          lastUpdated: new Date().toISOString()
        }
      })
      .eq('khatmah_id', khatmahId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error syncing progress to database:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Progress synced to database successfully:', {
      khatmahId,
      pagesCount: Object.keys(progressData.pagesRead).length,
      percentComplete: progressData.percentComplete
    });
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Exception in syncMemberProgress:', error);
    return { success: false, error: 'Failed to sync progress' };
  }
}

// Get all members with progress for a khatmah
export async function getKhatmahMembersWithProgress(
  khatmahId: string
): Promise<{
  members: Array<{
    id: string;
    fullName: string;
    email: string;
    progressPercent: number;
    pagesRead: number;
    lastUpdated: string | null;
    status: string;
  }>;
  error: string | null;
}> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { members: [], error: 'User not authenticated' };
    }

    // Fetch members with progress_data and full_name
    const { data: members, error } = await supabase
      .from('private_khatmah_members')
      .select('id, khatmah_id, user_id, email, status, joined_at, progress_data, full_name')
      .eq('khatmah_id', khatmahId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching members with progress:', error);
      return { members: [], error: error.message };
    }

    if (!members) {
      return { members: [], error: null };
    }

    // Format the response
    const formattedMembers = members.map((member: any) => {
      const progressData = member.progress_data || { pagesRead: {}, percentComplete: 0, lastUpdated: null };
      const pagesReadCount = Object.keys(progressData.pagesRead || {}).length;

      return {
        id: member.id,
        fullName: member.full_name || member.email.split('@')[0], // Use full_name if available, fallback to email prefix
        email: member.email,
        progressPercent: progressData.percentComplete || 0,
        pagesRead: pagesReadCount,
        lastUpdated: progressData.lastUpdated || member.joined_at,
        status: member.status
      };
    });

    return { members: formattedMembers, error: null };
  } catch (error) {
    console.error('Error in getKhatmahMembersWithProgress:', error);
    return { members: [], error: 'Failed to fetch members' };
  }
}

// Update member's full name
export async function updateMemberFullName(
  fullName: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Update full_name for all khatmahs the user is a member of
    const { error } = await supabase
      .from('private_khatmah_members')
      .update({ full_name: fullName })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating full name:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Full name updated:', fullName);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateMemberFullName:', error);
    return { success: false, error: 'Failed to update full name' };
  }
}

// Load progress from database for a specific khatmah
export async function loadProgressFromDatabase(
  khatmahId: string
): Promise<{
  progress: {
    pagesRead: { [key: string]: { completed: boolean; timestamp: string } };
    percentComplete: number;
    lastUpdated: string | null;
  } | null;
  error: string | null;
}> {
  try {
    const { user } = await getCurrentSession();
    
    if (!user) {
      return { progress: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('private_khatmah_members')
      .select('progress_data')
      .eq('khatmah_id', khatmahId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading progress from database:', error);
      return { progress: null, error: error.message };
    }

    return { progress: data?.progress_data || null, error: null };
  } catch (error) {
    console.error('Error in loadProgressFromDatabase:', error);
    return { progress: null, error: 'Failed to load progress' };
  }
}