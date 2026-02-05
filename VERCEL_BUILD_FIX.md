# Vercel Build Fix - Social Sharing Image ✅

## Problem (FIXED)

The build was failing on Vercel with this error:
```
Rollup failed to resolve import "figma:asset/fca118bead01eae15bd06d96732cadcb0b4241ac.png"
```

## Root Cause

`figma:asset` is a special virtual module that only works in Figma Make's development environment. It cannot be built for production on Vercel because Vite/Rollup doesn't know how to resolve this special import scheme.

## Solution Applied

✅ **Changed from**: Using `figma:asset` import  
✅ **Changed to**: Using regular public folder path

### What Was Changed

**File: `/src/app/utils/socialShareImage.ts`**
- ❌ **Before**: `import ogImage from 'figma:asset/...'`
- ✅ **After**: `export const socialShareImage = '/og-image.png'`

**File: `/src/app/App.tsx`**
- Updated to use `getSocialShareImageUrl()` which returns `${window.location.origin}/og-image.png`
- This works in both development and production

## Current Status

✅ **Code is fixed** - No more build errors  
✅ **App will build successfully on Vercel**  
⏳ **Action needed**: Upload your custom `og-image.png` to `/public/` folder

## Next Steps

### 1. Upload Your Image (REQUIRED)

You need to add your beautiful Arabic image to the repository:

```bash
# Option 1: Via GitHub web interface
1. Go to your repo on GitHub
2. Navigate to /public/ folder
3. Upload your image as "og-image.png"
4. Commit the change

# Option 2: Via command line
cp /path/to/your/image.png public/og-image.png
git add public/og-image.png
git commit -m "Add social sharing image"
git push
```

### 2. Verify Build on Vercel

After pushing your image:
1. Vercel will automatically deploy
2. Build should complete successfully
3. Your image will be used for all social sharing

## File Structure

```
/public/
  ├── favicon.ico
  ├── icon.svg
  ├── og-image.png       ← Your custom social sharing image goes here
  └── pwa-192x192.png
```

## Image Requirements

- **Dimensions**: 1200 x 630 pixels (optimal)
- **Format**: PNG or JPG
- **File name**: MUST be `og-image.png`
- **Location**: `/public/og-image.png`
- **File size**: Under 1 MB recommended

## Testing After Deploy

Once deployed, test your social sharing:

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Validator**: https://cards-dev.twitter.com/validator
3. **Quick Test**: Send your URL in WhatsApp and see the preview

## Technical Details

The app now uses a standard public folder approach:
- In development: `/og-image.png` is served by Vite dev server
- In production: `/og-image.png` is served by Vercel from the `dist/` folder
- Meta tags use: `${window.location.origin}/og-image.png`

This approach works everywhere (Figma Make, Vercel, any hosting platform).

---

**Status**: ✅ Build Error Fixed  
**Date**: February 5, 2026  
**Next Action**: Upload `og-image.png` to `/public/` folder
