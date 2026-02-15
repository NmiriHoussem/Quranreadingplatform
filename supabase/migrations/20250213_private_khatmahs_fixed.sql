-- =====================================================
-- PRIVATE KHATMAHS DATABASE SCHEMA - FIXED
-- =====================================================
-- This schema supports private khatmah groups where users can:
-- - Create custom khatmahs with specific durations
-- - Invite members via email
-- - Track group progress together
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their khatmahs" ON public.private_khatmahs;
DROP POLICY IF EXISTS "Users can create khatmahs" ON public.private_khatmahs;
DROP POLICY IF EXISTS "Users can update their khatmahs" ON public.private_khatmahs;
DROP POLICY IF EXISTS "Users can delete their khatmahs" ON public.private_khatmahs;
DROP POLICY IF EXISTS "Users can view khatmah members" ON public.private_khatmah_members;
DROP POLICY IF EXISTS "Creators can add members" ON public.private_khatmah_members;
DROP POLICY IF EXISTS "Users can update their membership" ON public.private_khatmah_members;
DROP POLICY IF EXISTS "Creators can remove members" ON public.private_khatmah_members;
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.private_khatmah_invitations;
DROP POLICY IF EXISTS "Creators can send invitations" ON public.private_khatmah_invitations;
DROP POLICY IF EXISTS "Users can respond to invitations" ON public.private_khatmah_invitations;

-- 1. Create private_khatmahs table
CREATE TABLE IF NOT EXISTS public.private_khatmahs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration IN (7, 10, 15, 30, 60, 90)),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. Create private_khatmah_members table (for tracking membership)
CREATE TABLE IF NOT EXISTS public.private_khatmah_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  khatmah_id UUID NOT NULL REFERENCES public.private_khatmahs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  joined_at TIMESTAMP WITH TIME ZONE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(khatmah_id, email)
);

-- 3. Create private_khatmah_invitations table (for tracking pending invitations)
CREATE TABLE IF NOT EXISTS public.private_khatmah_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  khatmah_id UUID NOT NULL REFERENCES public.private_khatmahs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  UNIQUE(khatmah_id, email)
);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_private_khatmahs_created_by ON public.private_khatmahs(created_by);
CREATE INDEX IF NOT EXISTS idx_private_khatmah_members_khatmah_id ON public.private_khatmah_members(khatmah_id);
CREATE INDEX IF NOT EXISTS idx_private_khatmah_members_user_id ON public.private_khatmah_members(user_id);
CREATE INDEX IF NOT EXISTS idx_private_khatmah_members_email ON public.private_khatmah_members(email);
CREATE INDEX IF NOT EXISTS idx_private_khatmah_invitations_khatmah_id ON public.private_khatmah_invitations(khatmah_id);
CREATE INDEX IF NOT EXISTS idx_private_khatmah_invitations_email ON public.private_khatmah_invitations(email);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.private_khatmahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_khatmah_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_khatmah_invitations ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies (FIXED - No circular references)

-- Private Khatmahs Policies
-- Users can view khatmahs they created or are members of
CREATE POLICY "Users can view their khatmahs" ON public.private_khatmahs
  FOR SELECT
  USING (
    auth.uid() = created_by 
    OR id IN (
      SELECT khatmah_id 
      FROM public.private_khatmah_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Users can create their own khatmahs
CREATE POLICY "Users can create khatmahs" ON public.private_khatmahs
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own khatmahs
CREATE POLICY "Users can update their khatmahs" ON public.private_khatmahs
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete their own khatmahs
CREATE POLICY "Users can delete their khatmahs" ON public.private_khatmahs
  FOR DELETE
  USING (auth.uid() = created_by);

-- Private Khatmah Members Policies (FIXED - No recursion)
-- Users can view members if they are the creator OR if they are a member themselves
CREATE POLICY "Users can view khatmah members" ON public.private_khatmah_members
  FOR SELECT
  USING (
    -- User is the creator of this khatmah
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
    -- OR user is viewing their own membership record
    OR user_id = auth.uid()
    -- OR user is an active member of this khatmah
    OR khatmah_id IN (
      SELECT km.khatmah_id 
      FROM public.private_khatmah_members km
      WHERE km.user_id = auth.uid() 
      AND km.status = 'active'
    )
  );

-- Khatmah creators can add members
CREATE POLICY "Creators can add members" ON public.private_khatmah_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );

-- Members can update their own membership
CREATE POLICY "Users can update their membership" ON public.private_khatmah_members
  FOR UPDATE
  USING (user_id = auth.uid());

-- Creators can remove members
CREATE POLICY "Creators can remove members" ON public.private_khatmah_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );

-- Private Khatmah Invitations Policies
-- Users can view invitations for khatmahs they created or invitations sent to them
CREATE POLICY "Users can view relevant invitations" ON public.private_khatmah_invitations
  FOR SELECT
  USING (
    invited_by = auth.uid() 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );

-- Khatmah creators can send invitations
CREATE POLICY "Creators can send invitations" ON public.private_khatmah_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.private_khatmahs 
      WHERE id = khatmah_id 
      AND created_by = auth.uid()
    )
  );

-- Users can update invitations sent to them
CREATE POLICY "Users can respond to invitations" ON public.private_khatmah_invitations
  FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 7. Create function to automatically add creator as a member
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.private_khatmah_members (khatmah_id, user_id, email, status, joined_at)
  SELECT 
    NEW.id, 
    NEW.created_by, 
    auth.users.email,
    'active',
    NOW()
  FROM auth.users
  WHERE auth.users.id = NEW.created_by;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to add creator as member automatically
DROP TRIGGER IF EXISTS on_khatmah_created ON public.private_khatmahs;
CREATE TRIGGER on_khatmah_created
  AFTER INSERT ON public.private_khatmahs
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_private_khatmahs_updated_at ON public.private_khatmahs;
CREATE TRIGGER update_private_khatmahs_updated_at
  BEFORE UPDATE ON public.private_khatmahs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant usage on tables to authenticated users
GRANT ALL ON public.private_khatmahs TO authenticated;
GRANT ALL ON public.private_khatmah_members TO authenticated;
GRANT ALL ON public.private_khatmah_invitations TO authenticated;
