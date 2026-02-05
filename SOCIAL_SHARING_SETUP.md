# Social Sharing Preview Setup

## Current Status ✅

Your website now has proper Open Graph and Twitter Card meta tags configured for social media sharing!

## What's Configured

The following meta tags are automatically added to every page:

### Open Graph (Facebook, LinkedIn, WhatsApp, etc.)
- `og:title` - Your app name (Quran Circle / حلقة القرآن)
- `og:description` - Your app description
- `og:type` - website
- `og:image` - Preview image URL
- `og:image:width` - Image width
- `og:image:height` - Image height
- `og:url` - Current page URL

### Twitter Card
- `twitter:card` - summary_large_image
- `twitter:title` - Your app name
- `twitter:description` - Your app description
- `twitter:image` - Preview image URL

## Current Preview Image

The beautiful Arabic social sharing image that says:
**"رحلتك الشخصية مع القرآن"** (Your Personal Journey with the Quran)

- **Location**: `figma:asset/fca118bead01eae15bd06d96732cadcb0b4241ac.png`
- **Used via**: `/src/app/utils/socialShareImage.ts`
- **Dimensions**: 1200 x 630 pixels (optimal for all social platforms)
- **Features**: Beautiful emerald green background with Arabic calligraphy and call-to-action button

## How to Improve the Preview Image

For the **best social sharing results**, create a custom preview image:

### Recommended Specifications:
- **Dimensions**: 1200 x 630 pixels (optimal for all platforms)
- **Format**: PNG or JPG
- **File size**: Under 1MB
- **Content**: Your logo + app name + tagline on a nice background

### Steps to Add a Custom Image:

1. **Create your image** (1200x630 px) with:
   - Your Quran Circle logo
   - App name in both Arabic and English
   - Emerald/Islamic green background
   - Optional: Quran-themed design elements

2. **Save the file** as `/public/og-image.png` or `/public/og-image.jpg`

3. **Update App.tsx** to use the new image:
   ```typescript
   // Change this line:
   updateOrCreateMetaTag('og:image', `${window.location.origin}/pwa-192x192.png`);
   
   // To:
   updateOrCreateMetaTag('og:image', `${window.location.origin}/og-image.png`);
   
   // And update dimensions:
   updateOrCreateMetaTag('og:image:width', '1200');
   updateOrCreateMetaTag('og:image:height', '630');
   
   // Also update Twitter image:
   updateOrCreateTwitterTag('twitter:image', `${window.location.origin}/og-image.png`);
   ```

## Testing Your Social Sharing Preview

### Facebook/LinkedIn/WhatsApp
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your website URL
3. Click "Debug" to see the preview
4. Click "Scrape Again" to refresh the cache

### Twitter
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your website URL
3. Preview will show immediately

### Alternative Testing Tools
- **Metatags.io**: https://metatags.io/
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
- **WhatsApp**: Just paste your link in a chat (send to yourself first!)

## Important Notes

⚠️ **Cache**: Social platforms cache preview images. After updating your image, you need to:
1. Use the debugging tools above to refresh the cache
2. Wait 24-48 hours for the cache to fully clear on all platforms

✅ **Current Setup**: Your meta tags are working! You just need to add a better image for maximum impact.

## Design Tips for Social Preview Image

### Good Elements to Include:
- ✅ Your uploaded logo (from admin panel)
- ✅ App name in Arabic: "حلقة القرآن"
- ✅ App name in English: "Quran Circle"
- ✅ Tagline: "Read & Memorize Together"
- ✅ Emerald green (#059669) brand color
- ✅ Islamic patterns or Quran imagery

### Tools to Create the Image:
- **Canva** (easiest, has templates for social media images)
- **Figma** (professional design)
- **Photoshop** or any image editor
- **Online generators**: search "Open Graph image generator"

---

**Need help?** The current setup works fine with the existing PWA icon. Upgrading to a custom 1200x630 image is optional but recommended for a more professional appearance when sharing on social media.