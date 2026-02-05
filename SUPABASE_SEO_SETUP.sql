-- =====================================================
-- Quran Circle - SEO Settings Setup
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

-- Allow authenticated users with admin role to update
CREATE POLICY "Allow admins to update SEO settings"
  ON seo_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Allow admins to insert
CREATE POLICY "Allow admins to insert SEO settings"
  ON seo_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

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

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload SEO images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'seo-images'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Allow authenticated admins to update
CREATE POLICY "Admins can update SEO images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'seo-images'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Allow authenticated admins to delete
CREATE POLICY "Admins can delete SEO images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'seo-images'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

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
-- =====================================================
