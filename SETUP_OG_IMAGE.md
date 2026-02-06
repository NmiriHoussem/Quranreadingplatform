# 🚀 Setup OG Image Database

## Step 1: Run SQL Migration in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/sxtdsxaibifgvtyeatzl
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the SQL below
5. Click **Run** (or press Cmd/Ctrl + Enter)

```sql
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
DROP POLICY IF EXISTS "SEO settings are publicly readable" ON public.seo_settings;
CREATE POLICY "SEO settings are publicly readable"
  ON public.seo_settings
  FOR SELECT
  TO public
  USING (true);

-- Policy: Only authenticated admins can update SEO settings
DROP POLICY IF EXISTS "Only admins can update SEO settings" ON public.seo_settings;
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
```

## Step 2: Create Storage Bucket (if not exists)

1. In Supabase Dashboard, click **Storage** in the left sidebar
2. Check if bucket `seo-images` exists
3. If not, click **New bucket**
   - Name: `seo-images`
   - ✅ Check **Public bucket**
   - Click **Create bucket**

## Step 3: Set Storage Policies

If the bucket already exists, make sure it's PUBLIC:
1. Click on the `seo-images` bucket
2. Click **Configuration** (gear icon)
3. Make sure **Public bucket** is enabled

Then run this SQL to set up storage policies:

```sql
-- Storage policies for seo-images bucket
-- Drop existing policies first
DROP POLICY IF EXISTS "SEO images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload SEO images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update SEO images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete SEO images" ON storage.objects;

-- Policy: Everyone can read from seo-images bucket
CREATE POLICY "SEO images are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'seo-images');

-- Policy: Authenticated admins can upload to seo-images bucket
CREATE POLICY "Admins can upload SEO images"
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
CREATE POLICY "Admins can update SEO images"
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
CREATE POLICY "Admins can delete SEO images"
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
```

## Step 4: Verify Setup

Run this query to verify the table was created:

```sql
SELECT * FROM public.seo_settings WHERE setting_key = 'og_image';
```

You should see 1 row with `image_url = NULL`.

## Step 5: Upload an Image

1. Go to your admin panel: https://qurancircle.net/admin
2. Click on **SEO Settings** tab
3. Upload your OG image (recommended size: 1200x630px)
4. The image will be uploaded to Supabase Storage
5. The database will be updated with the public URL

## Step 6: Test

1. Visit: https://qurancircle.net/api/og-image
   - Should show your uploaded image (or the default if none uploaded yet)

2. Visit: https://qurancircle.net/api/og-image-test
   - Should show JSON with database info and image URL

3. Visit: https://qurancircle.net/test-og.html
   - Should show diagnostic page with your image preview

## Troubleshooting

### Error: "relation 'seo_settings' does not exist"
- Run the SQL in Step 1 again

### Error: "permission denied for table seo_settings"
- Make sure RLS policies are set up (run Step 1 SQL again)

### Image upload fails in admin panel
- Check that storage bucket `seo-images` is PUBLIC
- Run Step 3 SQL to set up storage policies

### /api/og-image shows blank page
- Check Vercel function logs
- Run diagnostic: https://qurancircle.net/api/og-image-test
- Make sure the database has a row for 'og_image'

### Social media still shows old image
- Clear cache: https://www.linkedin.com/post-inspector/
- Wait 5-10 minutes for CDN cache to clear
- Social media platforms cache for 24-48 hours
