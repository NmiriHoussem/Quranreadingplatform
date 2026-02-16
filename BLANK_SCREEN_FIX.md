# Blank Screen Production Fix

## Problem
Blank white screen showing on qurancircle.net after deployment.

## Root Causes Identified

### 1. Missing SPA Rewrite in vercel.json ❌
**Problem:** Vercel wasn't serving index.html for all routes, breaking React Router.

**Solution:** Added catch-all rewrite rule:
```json
{
  "rewrites": [
    {
      "source": "/og-image.png",
      "destination": "/api/og-image"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Service Worker Cache Issues ❌
**Problem:** Old service worker cached broken version.

**Solution:** Added immediate activation:
```ts
workbox: {
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
}
```

### 3. Silent Errors in Production ❌
**Problem:** No error handling to catch initialization failures.

**Solution:** Added comprehensive error handling in main.tsx:
```ts
try {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App mounted successfully');
} catch (error) {
  console.error('Failed to mount React app:', error);
  // Show error UI
}
```

## Changes Made

### ✅ 1. Updated `/vercel.json`
Added SPA fallback rewrite rule to serve index.html for all routes.

### ✅ 2. Updated `/vite.config.pwa.ts`
- Added `skipWaiting: true` - Service worker activates immediately
- Added `clientsClaim: true` - Takes control of pages immediately
- Fixed `navigateFallback` path to `/index.html`

### ✅ 3. Updated `/src/main.tsx`
- Wrapped service worker registration in try-catch
- Added app mount error handling
- Added error UI display for debugging

## How to Deploy

### Step 1: Commit Changes
```bash
git add .
git commit -m "Fix: Blank screen in production - Add SPA rewrites and error handling"
git push
```

### Step 2: Deploy to Vercel
Vercel will automatically deploy the changes.

### Step 3: Clear Service Worker Cache
**Important:** Users need to clear their service worker cache.

**Option A - Manual (Quick):**
1. Open qurancircle.net
2. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. This force-refreshes and clears cache

**Option B - DevTools (Thorough):**
1. Open qurancircle.net
2. Press F12 to open DevTools
3. Go to "Application" tab
4. Click "Service Workers"
5. Click "Unregister" on any registered workers
6. Go to "Storage" → "Clear site data"
7. Refresh the page

### Step 4: Verify Fix
1. Open https://qurancircle.net in incognito mode
2. You should see the landing page, not a blank screen
3. Check browser console for any errors
4. Navigate to different routes (/home, /auth, etc.)

## Testing Checklist

- [ ] Landing page loads (/)
- [ ] Auth page loads (/auth)
- [ ] Home page loads (/home)
- [ ] Reading dashboard loads (/reading-dashboard)
- [ ] Direct URL navigation works
- [ ] Back/forward buttons work
- [ ] Refresh on any route works
- [ ] No console errors
- [ ] Service worker registers successfully

## Common Issues & Solutions

### Issue: Still seeing blank screen
**Solution:**
1. Clear browser cache completely
2. Use incognito/private mode
3. Check browser console for errors
4. Verify Vercel deployment succeeded

### Issue: "Loading..." spinner stuck
**Problem:** App.tsx loading state not resolving.

**Check:**
1. Supabase connection working
2. Auth check completing
3. Console errors present

### Issue: Service worker errors
**Solution:**
1. Unregister old service worker in DevTools
2. Clear all site data
3. Hard refresh (Ctrl+Shift+R)

## Architecture Notes

### SPA Routing in Vercel
Vercel needs explicit configuration to serve index.html for all routes:
```json
{
  "source": "/(.*)",
  "destination": "/index.html"
}
```

Without this, navigating to `/home` returns 404 because Vercel looks for `/home/index.html`.

### Service Worker Lifecycle
PWAs cache heavily. New deployments need:
- `skipWaiting: true` - Don't wait for old SW to deactivate
- `clientsClaim: true` - Take control immediately
- User hard refresh - Clear old cache

### React Router v7
Using `react-router-dom` for BrowserRouter (DOM-specific):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
```

Other components use `react-router` for hooks:
```tsx
import { useNavigate, useParams } from 'react-router';
```

## Files Modified

1. `/vercel.json` - Added SPA rewrite rule
2. `/vite.config.pwa.ts` - Updated service worker config
3. `/src/main.tsx` - Added error handling

## Verification

After deploying, verify:
1. ✅ All routes work in production
2. ✅ Hard refresh works on any page
3. ✅ Service worker registers without errors
4. ✅ No blank screens
5. ✅ Console is clean

## Next Steps

If the blank screen persists after these fixes:

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard
   - Click on deployment
   - Check build and runtime logs

2. **Check Browser Console:**
   - Look for JavaScript errors
   - Check network requests
   - Look for failed API calls

3. **Test Locally:**
   ```bash
   npm run build
   npx serve dist
   ```
   - Visit http://localhost:3000
   - Test all routes
   - Check if issue reproduces

4. **Verify Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set

## Summary

✅ **Fixed:** SPA routing with Vercel rewrite rule  
✅ **Fixed:** Service worker immediate activation  
✅ **Fixed:** Error handling for debugging  
✅ **Fixed:** Navigate fallback path

The blank screen issue should now be resolved. Users may need to clear their service worker cache once.
