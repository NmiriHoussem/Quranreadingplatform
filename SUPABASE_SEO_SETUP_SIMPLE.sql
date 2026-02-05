-- =====================================================
-- Quran Circle - SEO Settings Setup (Simplified)
-- =====================================================
-- This file contains SQL commands to set up SEO settings storage
-- Run these commands in your Supabase SQL Editor
-- =====================================================

-- 1. Create SEO settings table
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default SEO settings
INSERT INTO seo_settings (setting_key, setting_value, image_url)
VALUES 
  ('og_image', NULL, NULL),
  ('site_title', 'حلقة القرآن - Quran Circle', NULL),
  ('site_description', 'منصة خالية من التشتيت للقراءة والحفظ وإتمام القرآن من خلال التتبع الشخصي والحلقات المجدولة', NULL)
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Enable Row Level Security
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
-- Allow public read access (for fetching OG image on app load)
CREATE POLICY "Allow public read access to SEO settings"
  ON seo_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow any authenticated user to update (simplified - no admin check)
CREATE POLICY "Allow authenticated users to update SEO settings"
  ON seo_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow any authenticated user to insert (simplified - no admin check)
CREATE POLICY "Allow authenticated users to insert SEO settings"
  ON seo_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Create storage bucket for SEO images
INSERT INTO storage.buckets (id, name, public)
VALUES ('seo-images', 'seo-images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies for seo-images bucket
-- Allow public read access (so OG images can be accessed by social media crawlers)
CREATE POLICY "Public read access for SEO images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'seo-images');

-- Allow any authenticated user to upload (simplified - no admin check)
CREATE POLICY "Authenticated users can upload SEO images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'seo-images');

-- Allow any authenticated user to update (simplified - no admin check)
CREATE POLICY "Authenticated users can update SEO images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'seo-images');

-- Allow any authenticated user to delete (simplified - no admin check)
CREATE POLICY "Authenticated users can delete SEO images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'seo-images');

-- 7. Create function to update timestamp
CREATE OR REPLACE FUNCTION update_seo_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger
DROP TRIGGER IF EXISTS update_seo_settings_timestamp ON seo_settings;
CREATE TRIGGER update_seo_settings_timestamp
  BEFORE UPDATE ON seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_settings_timestamp();

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Now you can:
-- 1. Upload OG images to the 'seo-images' storage bucket
-- 2. Store the URL in seo_settings table
-- 3. Fetch the image URL on app load for meta tags
-- 
-- NOTE: This simplified version allows any authenticated user
-- to update SEO settings. Once you have the user_profiles table
-- with admin roles, you can update the policies to restrict
-- access to admins only.
-- =====================================================
