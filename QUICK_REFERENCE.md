# Quick Reference: Dynamic OG Image

## Admin Workflow (No Changes Needed!)

1. Log in to admin panel: `https://qurancircle.net/admin`
2. Click "إعدادات SEO" (SEO Settings)
3. Upload new image (PNG/JPG, 1200x630px, <2MB)
4. Done! ✅

**The image is now live at:** `https://qurancircle.net/og-image.png`

## Testing

```bash
# Check if image is accessible
curl -I https://qurancircle.net/og-image.png

# Download current image
curl https://qurancircle.net/og-image.png > current-og-image.png

# Test with LinkedIn
# Visit: https://www.linkedin.com/post-inspector/
```

## Technical Details

| Aspect | Value |
|--------|-------|
| **URL** | `https://qurancircle.net/og-image.png` |
| **Powered by** | Vercel Edge Function |
| **Source** | Supabase Storage (`seo-images` bucket) |
| **Cache** | 1 hour (CDN) |
| **Fallback** | `/public/og-image.png` (static) |
| **Update time** | Immediate (for new visitors) |
| **Cost** | Free (Vercel + Supabase free tiers) |

## Files Modified

```
/api/og-image.ts          ← NEW: Edge function
/vercel.json              ← UPDATED: Added rewrite rule
/index.html               ← UPDATED: Points to qurancircle.net domain
```

## Deployment

```bash
git add .
git commit -m "Add dynamic OG image support"
git push
```

Wait 2-3 minutes for Vercel deployment to complete.

## Verification Checklist

After deployment:

- [ ] Visit `https://qurancircle.net/og-image.png` in browser (should show image)
- [ ] Upload new image via admin panel
- [ ] Refresh `https://qurancircle.net/og-image.png` (should show new image)
- [ ] Test with LinkedIn Post Inspector
- [ ] Test with Facebook Debugger
- [ ] Check Vercel logs for any errors

## Troubleshooting

**Image not updating?**
- Wait 1 hour (cache)
- Check Supabase `seo_settings` table
- Check Vercel function logs: `vercel logs --function=api/og-image`

**404 error?**
- Verify deployment succeeded
- Check `/vercel.json` has rewrite rule
- Test edge function directly: `curl https://qurancircle.net/api/og-image`

**Fallback to static image?**
- Check Supabase connection
- Verify `seo_settings` table exists
- Check environment variables in Vercel

## Support

Full documentation: `/DYNAMIC_OG_IMAGE_COMPLETE.md`
Analysis: `/ANALYSIS_DYNAMIC_OG_IMAGE.md`
Testing script: `/test-og-image.sh`
