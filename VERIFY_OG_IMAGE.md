# How to Verify OG Image is Working

## Issue
LinkedIn Post Inspector shows: **"No image found"**

## Likely Causes & Solutions

### 1. Image Not Deployed Yet ⏳
**Solution:** You need to deploy the updated `index.html` first!

```bash
git add .
git commit -m "Fix LinkedIn OG tags with correct domain"
git push
```

Wait for deployment to complete, then test again.

### 2. Check if Image is Accessible 🔍

After deployment, test if the image is accessible:

**Open in browser:**
```
https://qurancircle.net/og-image.png
```

You should see the image. If you get a 404, the image wasn't deployed.

### 3. Vite Public Folder Issue 📁

Vite copies files from `/public/` to the root during build. Verify the build:

```bash
npm run build
ls -la dist/og-image.png
```

You should see `og-image.png` in the `dist` folder.

### 4. Image Requirements ✅

LinkedIn requires:
- ✅ Format: PNG or JPG
- ✅ Dimensions: Minimum 200x200, optimal 1200x630
- ✅ File size: Under 5MB
- ✅ Absolute URL (not relative): `https://qurancircle.net/og-image.png`
- ✅ Image must be publicly accessible (no authentication required)

### 5. Clear LinkedIn Cache 🔄

After fixing, LinkedIn caches for 7 days. Force refresh:

1. Go to: https://www.linkedin.com/post-inspector/
2. Enter: `https://qurancircle.net/`
3. Click **"Inspect"**
4. Check the metadata table

## Quick Debugging Checklist

Run these tests **after deployment**:

### Test 1: Check HTML Meta Tags
```bash
curl https://qurancircle.net/ | grep "og:image"
```

Expected output:
```html
<meta property="og:image" content="https://qurancircle.net/og-image.png" />
```

### Test 2: Check Image Accessibility
```bash
curl -I https://qurancircle.net/og-image.png
```

Expected output:
```
HTTP/2 200
content-type: image/png
content-length: [some number]
```

If you get `404 Not Found`, the image isn't deployed.

### Test 3: Verify Image Downloads
```bash
curl -o test-image.png https://qurancircle.net/og-image.png
```

This should download the image. Check file size:
```bash
ls -lh test-image.png
```

Should be a reasonable size (not 0 bytes).

## Common Issues & Fixes

### Issue: 404 on og-image.png
**Cause:** Image not in build output  
**Fix:** Check `/public/og-image.png` exists, then rebuild:
```bash
npm run build
```

### Issue: Image shows in browser but not LinkedIn
**Cause:** Image too large or wrong format  
**Fix:** Optimize image:
- Use PNG or JPG only
- Keep under 1MB (5MB max)
- Exactly 1200x630px dimensions

### Issue: LinkedIn still shows old/no image
**Cause:** LinkedIn cache (7 days)  
**Fix:** Use Post Inspector to force refresh

## Expected LinkedIn Post Inspector Output

After fixing, you should see:

```
✅ Title: Quran Circle - حلقة القرآن
✅ Description: A distraction-free platform for reading, memorizing, and completing the Quran through personal tracking and anonymous circle goals
✅ Image: [thumbnail of og-image.png]
✅ URL: https://qurancircle.net/
```

## Alternative: Use Supabase Storage

If the image still doesn't work, you can upload to Supabase Storage and use that URL:

1. Upload `og-image.png` to Supabase Storage (make it public)
2. Get the public URL (e.g., `https://[project].supabase.co/storage/v1/object/public/images/og-image.png`)
3. Update `index.html` with the Supabase URL

## Need Help?

If the image still doesn't show after deployment:
1. Share the output of: `curl -I https://qurancircle.net/og-image.png`
2. Share a screenshot of the build output showing `dist/` folder contents
3. Check browser console for any errors when loading the image
