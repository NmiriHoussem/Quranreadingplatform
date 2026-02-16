# Fix Router Import Mismatch

## Problem
Components are importing from `'react-router'` but App.tsx uses BrowserRouter from `'react-router-dom'`.

This creates a context mismatch causing:
```
Error: useNavigate() may be used only in the context of a <Router> component.
```

## Solution
Change all imports from `'react-router'` to `'react-router-dom'` to match the Router context.

## Files to Update (20 files)

1. /src/app/components/AdminPanel.tsx
2. /src/app/components/AppHeader.tsx
3. /src/app/components/Auth.tsx
4. /src/app/components/AuthPage.tsx
5. /src/app/components/Dashboard.tsx
6. /src/app/components/GroupGoalDetail.tsx
7. /src/app/components/GroupGoals.tsx
8. /src/app/components/HelpPage.tsx
9. /src/app/components/HomePage.tsx
10. /src/app/components/KhatmahReader.tsx
11. /src/app/components/LandingPage.tsx
12. /src/app/components/MemorizationDashboard.tsx
13. /src/app/components/ProfileMenu.tsx
14. /src/app/components/QuranReader.tsx
15. /src/app/components/ReadingDashboard.tsx
16. /src/app/components/Settings.tsx
17. /src/app/components/DebugInvitations.tsx
18. /src/app/components/PrivateKhatmahDetailPage.tsx
19. /src/app/components/PrivateKhatmahReader.tsx
20. /src/app/pages/DownloadQuran.tsx

## Change Required

**Before:**
```tsx
import { useNavigate, Link, useParams } from 'react-router';
```

**After:**
```tsx
import { useNavigate, Link, useParams } from 'react-router-dom';
```

## Why This Fixes It

React Router v7 requires that the Router context provider (BrowserRouter) and the hooks/components (useNavigate, Link, etc.) come from the SAME package to share the same React context.

When BrowserRouter comes from 'react-router-dom' but useNavigate comes from 'react-router', they use different context instances, causing the "not in context" error.
