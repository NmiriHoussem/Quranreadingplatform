# React Router Context Fix - Complete Solution

## The Problem

```
Error: useNavigate() may be used only in the context of a <Router> component.
```

**Root Cause:** React Router v7 context mismatch

- App.tsx uses `BrowserRouter` from `'react-router-dom'`
- Child components import hooks from `'react-router'`
- These create different React contexts, causing the error

## The Solution

**Change ALL component imports from `'react-router'` to `'react-router-dom'`**

## Files Updated

✅ Already Updated:
1. /src/app/App.tsx
2. /src/app/components/AdminPanel.tsx
3. /src/app/components/AppHeader.tsx
4. /src/app/components/Auth.tsx
5. /src/app/components/AuthPage.tsx
6. /src/app/components/Dashboard.tsx

⏳ Still Need Updates:
7. /src/app/components/GroupGoalDetail.tsx
8. /src/app/components/GroupGoals.tsx
9. /src/app/components/HelpPage.tsx
10. /src/app/components/HomePage.tsx
11. /src/app/components/KhatmahReader.tsx
12. /src/app/components/LandingPage.tsx
13. /src/app/components/MemorizationDashboard.tsx
14. /src/app/components/ProfileMenu.tsx
15. /src/app/components/QuranReader.tsx
16. /src/app/components/ReadingDashboard.tsx
17. /src/app/components/Settings.tsx
18. /src/app/components/DebugInvitations.tsx
19. /src/app/components/PrivateKhatmahDetailPage.tsx
20. /src/app/components/PrivateKhatmahReader.tsx
21. /src/app/pages/DownloadQuran.tsx

## Quick Fix Command

Use find/replace in your editor:
- **Find:** `from 'react-router'`
- **Replace with:** `from 'react-router-dom'`
- **Files:** All .tsx files in src/app/components and src/app/pages

OR use sed command:
```bash
find src/app -name "*.tsx" -type f -exec sed -i "s/from 'react-router'/from 'react-router-dom'/g" {} \;
```

## Why This Fixes It

React Router v7 architecture:
- `react-router-dom` provides BrowserRouter and all hooks
- `react-router` is the core (framework-agnostic)
- When mixing packages, they don't share the same React context

**The fix:** Use `react-router-dom` for EVERYTHING to ensure single context instance.

## After Applying Fix

1. All router errors will be resolved
2. Navigation will work correctly
3. All hooks (useNavigate, useParams, useLocation, etc.) will function
4. No more blank screens in production

## Deploy Steps

1. Apply the find/replace changes
2. Verify no 'react-router' imports remain:
   ```bash
   grep -r "from 'react-router'" src/
   ```
3. Should return: No results
4. Commit and push
5. Vercel will auto-deploy

## Test Checklist

After deployment:
- [ ] Landing page loads
- [ ] Can navigate to /auth
- [ ] Can navigate to /home
- [ ] Can navigate to /reading-dashboard
- [ ] All group pages work
- [ ] No console errors
- [ ] All navigation buttons work

---

**Status:** 6/21 files updated. Need to complete remaining 15 files.
