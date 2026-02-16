# React Router v7 - Correct Import Guide

## The Issue

In React Router v7, there are TWO packages:
1. **`react-router`** - Core routing logic (framework-agnostic)
2. **`react-router-dom`** - DOM/browser-specific components

## The Rule: What to Import from Where

### ✅ From `react-router-dom`
**Router Components** (DOM-specific, must use react-router-dom):
```tsx
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
```

These MUST come from `react-router-dom`:
- `BrowserRouter` / `HashRouter` / `MemoryRouter`
- `Routes`
- `Route`
- `Navigate`
- `Link`
- `NavLink`
- `Form`
- `ScrollRestoration`

### ✅ From `react-router`
**Hooks & Utilities** (can use react-router):
```tsx
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router';
```

These CAN come from `react-router`:
- `useNavigate`
- `useParams`
- `useLocation`
- `useSearchParams`
- `useMatches`
- `useRouteError`
- `Outlet`
- `matchPath`
- etc.

## Why This Matters

### ❌ Wrong (Causes "Invalid hook call" error):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router';
```

This breaks because `BrowserRouter` is a DOM-specific component that relies on `react-dom`. When imported from `react-router`, it causes React hook errors.

### ✅ Correct:
```tsx
// App.tsx - Main router setup
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

// Other components - Navigation hooks
import { useNavigate, useParams, useLocation } from 'react-router';
```

## Our App Structure

### App.tsx (Main Router)
```tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
```
- Uses `react-router-dom` because it renders `BrowserRouter`, `Routes`, `Route`, `Navigate`

### Other Components (Navigation Logic)
```tsx
import { useNavigate, useParams, useLocation } from 'react-router';
```
- Uses `react-router` for hooks and utilities
- Cleaner imports, better tree-shaking

## Files in Our App

### Using `react-router-dom` (1 file):
- ✅ `/src/app/App.tsx` - Main router setup

### Using `react-router` (20 files):
- ✅ `/src/app/components/Auth.tsx`
- ✅ `/src/app/components/ReadingDashboard.tsx`
- ✅ `/src/app/components/LandingPage.tsx`
- ✅ `/src/app/components/HomePage.tsx`
- ✅ `/src/app/components/Dashboard.tsx`
- ✅ `/src/app/components/QuranReader.tsx`
- ✅ `/src/app/components/KhatmahReader.tsx`
- ✅ `/src/app/components/PrivateKhatmahReader.tsx`
- ✅ `/src/app/components/PrivateKhatmahDetailPage.tsx`
- ✅ `/src/app/components/GroupGoals.tsx`
- ✅ `/src/app/components/GroupGoalDetail.tsx`
- ✅ `/src/app/components/MemorizationDashboard.tsx`
- ✅ `/src/app/components/Settings.tsx`
- ✅ `/src/app/components/HelpPage.tsx`
- ✅ `/src/app/components/ProfileMenu.tsx`
- ✅ `/src/app/components/AppHeader.tsx`
- ✅ `/src/app/components/AuthPage.tsx`
- ✅ `/src/app/components/AdminPanel.tsx`
- ✅ `/src/app/components/DebugInvitations.tsx`
- ✅ `/src/app/pages/DownloadQuran.tsx`

## Quick Reference

| Import | Package | Why |
|--------|---------|-----|
| `BrowserRouter` | `react-router-dom` | DOM component |
| `Routes` | `react-router-dom` | DOM component |
| `Route` | `react-router-dom` | DOM component |
| `Navigate` | `react-router-dom` | DOM component |
| `Link` | `react-router-dom` | DOM component |
| `NavLink` | `react-router-dom` | DOM component |
| `useNavigate` | `react-router` | Hook (framework-agnostic) |
| `useParams` | `react-router` | Hook (framework-agnostic) |
| `useLocation` | `react-router` | Hook (framework-agnostic) |
| `useSearchParams` | `react-router` | Hook (framework-agnostic) |

## Error Debugging

### If you see "Invalid hook call":
1. Check if you're importing `BrowserRouter`, `Routes`, `Route`, or `Navigate` from `react-router`
2. Change the import to `react-router-dom`
3. Only import hooks from `react-router`

### If you see "No routes matched":
1. Check your route paths
2. Make sure you have a catch-all route (`path="*"`)
3. Verify the URL matches a defined route

## Summary

✅ **Router components** → `react-router-dom`  
✅ **Hooks & utilities** → `react-router`  
✅ **App.tsx** uses `react-router-dom`  
✅ **All other components** use `react-router`

This separation provides:
- Better code organization
- Cleaner imports
- Framework-agnostic core
- Better tree-shaking
- Future compatibility

---

**Current Status:** ✅ All fixed and working!
