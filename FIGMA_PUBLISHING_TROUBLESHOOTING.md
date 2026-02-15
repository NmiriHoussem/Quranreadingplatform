# Figma Make Publishing Issues - Troubleshooting Guide

## Current Issue
Publishing is stuck on "Publishing..." and not completing.

## Possible Causes & Solutions

### 1. **Large Build Size** (Most Common)
Your app has extensive PWA configuration with service workers and caching. This can make the build too large for Figma's publishing.

**Solution:**
Temporarily disable PWA for publishing to Figma Make:

Create a file `vite.config.figma.ts`:
```typescript
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    }
  }
})
```

### 2. **Service Worker Registration Issue**
The service worker registration in `main.tsx` might conflict with Figma's build system.

**Quick Fix:** Comment out the service worker registration temporarily:

```typescript
// import { registerSW } from 'virtual:pwa-register';

// Temporarily disabled for Figma publishing
// const updateSW = registerSW({ ... });
```

### 3. **React Router Version Conflict**
You're using `react-router-dom` v7, but Figma Make expects v6 or the `react-router` package.

**Solution:** 
This shouldn't block publishing, but if issues persist, downgrade:
```bash
pnpm remove react-router-dom
pnpm add react-router-dom@6.28.0
```

### 4. **External API Dependencies**
Your app makes calls to:
- api.quran.com
- tanzil.net
- GitHub raw content
- Supabase

**This is fine**, but ensure these don't block the build process.

### 5. **Build Timeout**
Large apps can timeout during Figma's build process.

## Immediate Actions to Try

### Option A: Quick Republish (Try this first)
1. Close the publishing dialog
2. Make a small change to your app (add a comment anywhere)
3. Try publishing again
4. Sometimes Figma just needs a retry

### Option B: Simplify for Publishing
1. Create a new git branch: `figma-publish`
2. Temporarily disable PWA:
   - Comment out PWA plugin in `vite.config.ts`
   - Comment out service worker registration in `main.tsx`
3. Publish this simplified version
4. Switch back to main branch for production deployment

### Option C: Use Vercel Instead
Since your app is already deployed to Vercel at `qurancircle.net`, you might not need Figma Make publishing. Figma Make publishing is mainly useful for sharing prototypes, but your production app is already live.

## Steps to Disable PWA for Figma Publishing

1. **Backup your current `vite.config.ts`**
2. **Replace with simplified version** (see below)
3. **Comment out service worker in `main.tsx`**
4. **Try publishing**
5. **Revert changes after successful publish**

## Simplified vite.config.ts for Publishing

```typescript
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## Check Build Locally

Before publishing, test the build locally:

```bash
pnpm run build
```

Look for:
- ✅ No build errors
- ✅ Dist folder created
- ✅ Reasonable bundle size (< 5MB total)
- ❌ Any warnings about large chunks

## Alternative: Contact Figma Support

If nothing works:
1. In Figma, go to Help → Contact Support
2. Mention: "Make publishing stuck on Publishing..."
3. Provide your file URL: `quranpartner.figma.site`
4. They can check server-side issues

## Note About Your Production App

Your app at `https://qurancircle.net` is deployed via Vercel and is separate from Figma Make publishing. The Figma Make publish is just for the preview site at `quranpartner.figma.site`. 

**You can continue working and deploying to Vercel even if Figma publishing is stuck.**

## When to Worry

- ❌ If stuck for more than 10 minutes
- ❌ If it fails multiple times after retry
- ✅ If it says "Publishing..." for 2-3 minutes (this is normal)

## What Usually Works

**90% of the time**, simply:
1. Close the dialog
2. Wait 5 minutes
3. Click Publish again
4. Let it sit for up to 5 minutes

The publishing process can genuinely take several minutes for complex apps with lots of components and external dependencies.
