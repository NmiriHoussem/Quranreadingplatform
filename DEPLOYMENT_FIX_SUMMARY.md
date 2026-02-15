# Deployment Configuration Fix

## Problem Found ✅

You were right to suspect the PWA configuration! Here's what was happening:

1. **Figma Make** uses `vite.config.ts` (simple, no PWA)
2. **Vercel** was ALSO using `vite.config.ts` (simple, no PWA)
3. **You needed** Vercel to use `vite.config.pwa.ts` (full PWA with service workers)

Additionally:
- `main.tsx` had PWA service worker imports **commented out** (for Figma Make compatibility)
- But Vercel needs the PWA service worker to be **active**

## Build Error Encountered & Fixed 🔧

After switching to PWA config, Vercel build failed with:
```
Error: 'When using networkTimeoutSeconds, you must set the handler to 'NetworkFirst'.'
```

**Root cause**: Workbox doesn't allow `networkTimeoutSeconds` option with `CacheFirst` strategy - only with `NetworkFirst`.

**Solution**: Removed `networkTimeoutSeconds` from:
- Quran API cache (CacheFirst strategy)
- Tanzil API cache (CacheFirst strategy)

These APIs don't need network timeouts since they're using CacheFirst (offline-first) for static Quran data that rarely changes.

## Changes Made

### 1. Updated `/vercel.json`
```json
{
  "buildCommand": "vite build --config vite.config.pwa.ts",
  ...
}
```
Now Vercel uses the PWA config instead of the simple config.

### 2. Updated `/src/main.tsx`
Re-enabled the PWA service worker registration:
```typescript
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  ...
});
```

### 3. Fixed `/vite.config.pwa.ts`
Removed `networkTimeoutSeconds` from CacheFirst strategies:
- ✅ Quran API: CacheFirst (no timeout - offline-first)
- ✅ Tanzil API: CacheFirst (no timeout - offline-first)
- ✅ GitHub Images: CacheFirst (no timeout - offline-first)
- ✅ Supabase: NetworkFirst with 5s timeout (correct - needs fresh data)

## Next Steps

1. **Push these changes to GitHub** (same as before)
2. **Vercel will auto-deploy** with the PWA config
3. **Build will succeed!** ✅
4. **Your tabs will appear!** 🎉

## Why This Happened

You had set up two configurations:
- **Development/Figma Make**: Simple config without PWA (lighter, faster)
- **Production/Vercel**: Full PWA config with service workers (offline support)

But Vercel wasn't told to use the PWA config, so it was using the simple one - just like Figma Make!

The networkTimeoutSeconds issue was a misconfiguration in the Workbox cache strategies that only showed up when building with the PWA plugin.

## Verification

After deploying, you should see:
- ✅ Public/Private tabs in the Reading Dashboard
- ✅ Service worker registered in browser console
- ✅ PWA install prompt (if not already installed)
- ✅ Full offline functionality with correct cache strategies