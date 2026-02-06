# 🧪 Test OG Image Setup

## Quick Tests

### 1. Test the Edge Function Directly

Open these URLs in your browser:

```
https://qurancircle.net/api/og-image
```

**Expected:** Should display your uploaded image

### 2. Test the Static Fallback

```
https://qurancircle.net/og-image.png
```

**Expected:** Should display the default OG image from `/public/og-image.png`

### 3. Check Database Value

Run this in your Supabase SQL Editor:

```sql
SELECT * FROM seo_settings WHERE setting_key = 'og_image';
```

**Expected:** Should show a row with `image_url` containing a Supabase Storage URL

### 4. Test Supabase Storage URL Directly

Copy the `image_url` from the database and open it in a browser.

**Expected:** Should display your uploaded image

## Common Issues

### ❌ Issue: "No image found" in social media preview

**Cause:** Social media platforms cache metadata for 24-48 hours

**Solution:** Force re-scrape using these tools:

1. **LinkedIn:** https://www.linkedin.com/post-inspector/
2. **Facebook:** https://developers.facebook.com/tools/debug/
3. **Twitter:** https://cards-dev.twitter.com/validator

### ❌ Issue: Edge function redirects to `/og-image.png`

**Causes:**
- Database doesn't have the `og_image` row
- Image URL is invalid
- Supabase Storage bucket permissions are wrong

**Solution:** Check Supabase Storage bucket `seo-images` is set to **PUBLIC**

## Verify Current Setup

### Step 1: Check if image is in Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Find bucket: `seo-images`
3. Check folder: `og-images/`
4. Verify your image file exists

### Step 2: Check bucket is public

1. In Storage → `seo-images` bucket
2. Click bucket settings
3. Make sure "Public bucket" is **enabled**

### Step 3: Verify database entry

```sql
-- Should return 1 row with image_url
SELECT 
  setting_key,
  image_url,
  updated_at
FROM seo_settings 
WHERE setting_key = 'og_image';
```

### Step 4: Test the full flow

1. Visit: `https://qurancircle.net/api/og-image`
2. Check browser dev tools → Network tab
3. Look at the response:
   - **200 OK** = Image served successfully ✅
   - **302 Redirect** = Falling back to static image (check database)
   - **404/500** = Edge function error (check logs)

## Force Clear Social Media Cache

### LinkedIn (Most Important for Your Screenshot)

```bash
# 1. Go to:
https://www.linkedin.com/post-inspector/

# 2. Enter URL:
https://qurancircle.net

# 3. Click "Inspect"

# 4. Wait for results

# 5. If still showing old image, try:
https://qurancircle.net/?v=2
```

**Note:** LinkedIn is notorious for aggressive caching. It might take 24-48 hours.

### Quick Workaround: Add Cache Busting

If you need it to work immediately, add a version parameter:

```
https://qurancircle.net/?v=2
```

This makes LinkedIn think it's a new URL and forces a fresh scrape.

## Debug Checklist

- [ ] Supabase Storage bucket `seo-images` exists
- [ ] Bucket is set to PUBLIC
- [ ] Image file exists in `og-images/` folder
- [ ] Database has `og_image` row with valid `image_url`
- [ ] `image_url` opens correctly in browser
- [ ] `/api/og-image` endpoint returns 200 OK
- [ ] Forced re-scrape on LinkedIn
- [ ] Forced re-scrape on Facebook
- [ ] Cleared browser cache and tested
- [ ] Waited 5-10 minutes for CDN cache to clear

## Expected Timeline

- ✅ **Immediate:** Direct URL to image works
- ✅ **1-2 minutes:** Edge function serves new image
- ⏰ **5-10 minutes:** CDN cache clears
- ⏰ **1-24 hours:** Social media platforms refresh cache
- ⏰ **24-48 hours:** LinkedIn updates (they cache aggressively)

## If Still Not Working

1. Check Vercel deployment logs
2. Check Vercel Edge Function logs:
   - Vercel Dashboard → Your Project → Functions
   - Find `api/og-image` function
   - Check recent invocations and errors
3. Verify environment variables in Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
