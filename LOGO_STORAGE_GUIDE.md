# Logo Storage Guide

## Overview

The Quran Circle logo is now stored in the Supabase KV (Key-Value) database as a base64-encoded SVG. This ensures consistent logo display across both Figma Make and Vercel deployments without file path issues.

## How It Works

### 1. **Logo Storage**
- The logo SVG is converted to a base64 data URL
- Stored in the KV store with key: `app_logo_base64`
- Automatically initialized on first app load

### 2. **Logo Retrieval**
- On app startup, the logo is fetched from the KV store
- Cached in memory for performance
- Used for:
  - Favicon (browser tab icon)
  - Open Graph images (social sharing)
  - Twitter Card images
  - Logo component throughout the app

### 3. **Files**

#### `/src/app/utils/logoStorage.ts`
Main logo storage utility:
- `initializeLogo()` - Loads logo from KV store on app start
- `getLogo()` - Fetches logo from database
- `storeLogo()` - Stores logo in database
- `getCachedLogo()` - Returns cached logo (after initialization)

#### `/src/app/components/Logo.tsx`
Reusable Logo component:
```tsx
import Logo from './Logo';

<Logo size={32} className="..." />
```

#### `/src/app/utils/updateLogo.ts`
Utility to update the logo:
```typescript
import { updateLogoInDatabase } from './utils/updateLogo';

const newLogoSVG = `
  <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Your new SVG content -->
  </svg>
`;

updateLogoInDatabase(newLogoSVG);
```

## Updating the Logo

### Option 1: Using the Update Utility

1. Open browser console
2. Run:
```javascript
import('./utils/updateLogo.js').then(module => {
  const newSVG = `<svg>...</svg>`;
  module.updateLogoInDatabase(newSVG);
});
```

### Option 2: Direct Database Update

You can also update the logo directly in the Supabase KV store using the backend API:

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-bf07b5b1/kv/set \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "app_logo_base64",
    "value": "data:image/svg+xml;base64,PHN2Zy4uLjwvc3ZnPg=="
  }'
```

### Option 3: Modify the Source Code

Edit `/src/app/utils/logoStorage.ts` and update the `LOGO_SVG` constant, then the logo will be automatically stored on next app load.

## Benefits

✅ **No file path issues** - Logo is stored in database, not files  
✅ **Works in Figma Make** - No asset import problems  
✅ **Works in Vercel** - Same logo source for production  
✅ **Easy updates** - Change logo without code deployment  
✅ **Consistent** - Single source of truth for all logo usage  
✅ **Fast** - Cached in memory after initial load  

## Current Logo

The current logo is a beautiful Islamic-themed design featuring:
- Emerald green book/Quran shape
- Decorative Islamic circular pattern
- Arabic text-style calligraphic lines
- Islamic star ornament
- 512x512 SVG with rounded corners

## Technical Details

- **Storage Format**: Base64-encoded SVG data URL
- **Database Key**: `app_logo_base64`
- **File Type**: SVG (scalable vector graphics)
- **Size**: ~1.5KB (base64 encoded)
- **Cache**: In-memory after initialization
- **Fallback**: Local SVG constant if database fails

## Troubleshooting

### Logo not displaying?
1. Check browser console for errors
2. Verify KV store has the logo: `app_logo_base64` key
3. Try manually initializing: `initializeLogo()`

### Want to force refresh?
Clear the cache and reload:
```javascript
window.location.reload(true);
```

### Reset to default logo?
Call `storeLogo()` to restore the default:
```javascript
import { storeLogo } from './utils/logoStorage';
storeLogo();
```
