# 🚀 Quick Fix - OG Image Setup

## The Problem
- `/api/og-image` shows blank page
- `/api/og-image-test` shows blank page  
- Error in database: `relation "public.user_profiles" does not exist`

## The Solution (3 Steps - 2 Minutes)

### Step 1: Run SQL (Copy Everything Below)

1. Go to: https://supabase.com/dashboard/project/sxtdsxaibifgvtyeatzl/sql/new
2. Copy **ALL** the SQL from `/supabase/migrations/COMPLETE_OG_SETUP.sql`
3. Paste and click **Run**
4. You should see: "Setup complete! | 1 row"

### Step 2: Verify Bucket

1. Go to: https://supabase.com/dashboard/project/sxtdsxaibifgvtyeatzl/storage/buckets
2. Check if `seo-images` bucket exists and is **PUBLIC**
3. If not public, click the bucket → Configuration (gear icon) → Enable "Public bucket"

### Step 3: Test

1. Visit: https://qurancircle.net/api/og-image
   - Should show a green branded image with the Quran Circle logo and "حلقة القرآن"
   
2. Visit: https://qurancircle.net/api/og-image-test
   - Should show JSON (not an error)

3. **Better test:** Visit https://qurancircle.net/test-endpoints.html
   - This page tests both endpoints with detailed diagnostics
   - Shows exactly what's being returned

> **Note:** Some browsers may show a "blank page" when visiting API endpoints directly because they don't know how to render raw responses. The endpoints are working correctly if the test page shows the image! Social media crawlers will fetch the image properly.

## What Changed?

**Before:** Policy tried to check `user_profiles` table (doesn't exist)
```sql
-- ❌ OLD - BROKEN
WHERE user_profiles.role = 'admin'
```

**After:** Policy just checks if user is authenticated (admin check done in app)
```sql
-- ✅ NEW - WORKS
TO authenticated
USING (true)
```

## Now Upload Your Image

1. Go to: https://qurancircle.net/admin
2. Click **SEO Settings** tab
3. Upload your 1200x630px image
4. Done! The `/api/og-image` endpoint will serve your custom image

## Force Social Media to Re-scrape

After uploading:
- LinkedIn: https://www.linkedin.com/post-inspector/
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator

---

**Questions?** Check `/SETUP_OG_IMAGE.md` for detailed troubleshooting.