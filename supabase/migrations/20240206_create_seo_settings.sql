-- Create seo_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read SEO settings (needed for OG image endpoint)
CREATE POLICY "SEO settings are publicly readable"
  ON public.seo_settings
  FOR SELECT
  TO public
  USING (true);

-- Policy: Only authenticated admins can update SEO settings
CREATE POLICY "Only admins can update SEO settings"
  ON public.seo_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Insert default og_image row if it doesn't exist
INSERT INTO public.seo_settings (setting_key, setting_value, image_url)
VALUES ('og_image', NULL, NULL)
ON CONFLICT (setting_key) DO NOTHING;

-- Create storage bucket for SEO images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('seo-images', 'seo-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for seo-images bucket
-- Policy: Everyone can read from seo-images bucket
CREATE POLICY IF NOT EXISTS "SEO images are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'seo-images');

-- Policy: Authenticated admins can upload to seo-images bucket
CREATE POLICY IF NOT EXISTS "Admins can upload SEO images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'seo-images' AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Authenticated admins can update SEO images
CREATE POLICY IF NOT EXISTS "Admins can update SEO images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'seo-images' AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Authenticated admins can delete SEO images
CREATE POLICY IF NOT EXISTS "Admins can delete SEO images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'seo-images' AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
