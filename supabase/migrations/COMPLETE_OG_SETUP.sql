-- ============================================
-- Complete OG Image Setup (All-in-One)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create seo_settings table
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on seo_settings
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies if they exist
DROP POLICY IF EXISTS "SEO settings are publicly readable" ON public.seo_settings;
DROP POLICY IF EXISTS "Only authenticated users can update SEO settings" ON public.seo_settings;

-- 4. Create new policies for seo_settings
CREATE POLICY "SEO settings are publicly readable"
  ON public.seo_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can update SEO settings"
  ON public.seo_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Insert default og_image row
INSERT INTO public.seo_settings (setting_key, setting_value, image_url)
VALUES ('og_image', NULL, NULL)
ON CONFLICT (setting_key) DO NOTHING;

-- 6. Create storage bucket for SEO images
INSERT INTO storage.buckets (id, name, public)
VALUES ('seo-images', 'seo-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. Drop old storage policies if they exist
DROP POLICY IF EXISTS "SEO images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload SEO images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update SEO images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete SEO images" ON storage.objects;

-- 8. Create storage policies
CREATE POLICY "SEO images are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'seo-images');

CREATE POLICY "Authenticated users can upload SEO images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'seo-images');

CREATE POLICY "Authenticated users can update SEO images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'seo-images');

CREATE POLICY "Authenticated users can delete SEO images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'seo-images');

-- 9. Verify setup
SELECT 
  'Setup complete!' as status,
  COUNT(*) as seo_settings_rows
FROM public.seo_settings
WHERE setting_key = 'og_image';
