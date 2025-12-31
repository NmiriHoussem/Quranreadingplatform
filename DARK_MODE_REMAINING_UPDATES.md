# Dark Mode - Remaining Component Updates

## ✅ Completed
- Dashboard
- Settings
- MilestoneModal
- LandingPage
- QuranReader (partial - header and mode toggles)

## 🔄 Needs Dark Mode Styling

### AuthPage.tsx
```tsx
// Line 27 - Update main container
<div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900 flex items-center justify-center p-4">

// Line 28 - Update card
<Card className="w-full max-w-md p-8 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">

// All text-emerald-900 → add dark:text-emerald-100
// All text-emerald-600/700 → add dark:text-emerald-400/300
// All bg-emerald-600 buttons → add dark:bg-emerald-500 dark:hover:bg-emerald-600
// All border-emerald classes → add dark:border-emerald-700/800
```

### HelpPage.tsx
```tsx
// Line 14 - Main container
<div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">

// Header
<header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-50">

// All cards
<Card className="p-6 mb-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">

// All text classes need dark: variants
```

### GroupGoals.tsx
```tsx
// Line 239 - Main container
<div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">

// AppHeader already handles dark mode if properly imported

// Tabs
<Tabs className="dark:bg-emerald-950">
<TabsList className="dark:bg-emerald-900">
<TabsTrigger className="dark:data-[state=active]:bg-emerald-800">

// All cards
<Card className="border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">

// Badges
<Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">

// Dialog
<DialogContent className="dark:bg-emerald-950 dark:border-emerald-800">
```

### GroupGoalDetail.tsx
```tsx
// Line 88 - Main container  
<div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">

// Header
<header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80">

// Progress cards
<Card className="p-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">

// Checkboxes already use theme variables but ensure proper contrast
```

### QuranReader.tsx - Remaining Sections
```tsx
// All Loader2 instances
<Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />

// Error states
<div className="text-center text-red-600 dark:text-red-400">

// Verse cards in memorization mode
<Card className="p-4 mb-4 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">

// Drawer/Sidebar
<div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white dark:bg-emerald-950 shadow-2xl">

// Chapter list items
<button className="w-full text-left p-4 border-b border-emerald-100 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900">

// All text-emerald-900 → dark:text-emerald-100
// All text-emerald-600/700 → dark:text-emerald-400/300
// All bg-emerald-100 → dark:bg-emerald-900/50
// All border-emerald-200 → dark:border-emerald-700
```

## Pattern to Follow

For ANY component, apply these conversions:

### Backgrounds
```
bg-white → dark:bg-emerald-950
bg-emerald-50 → dark:bg-emerald-900/30
bg-emerald-100 → dark:bg-emerald-900/50
from-emerald-50 to-white → dark:from-emerald-950 dark:to-emerald-900
```

### Text
```
text-emerald-900 → dark:text-emerald-100
text-emerald-800 → dark:text-emerald-200
text-emerald-700 → dark:text-emerald-300
text-emerald-600 → dark:text-emerald-400
```

### Borders
```
border-emerald-100 → dark:border-emerald-800
border-emerald-200 → dark:border-emerald-700
border-emerald-600 → dark:border-emerald-500
```

### Buttons (Primary)
```
bg-emerald-600 → dark:bg-emerald-500
hover:bg-emerald-700 → dark:hover:bg-emerald-600
```

### Buttons (Outline)
```
border-emerald-600 text-emerald-600 → dark:border-emerald-500 dark:text-emerald-400
hover:bg-emerald-50 → dark:hover:bg-emerald-900
```

### Cards
```
<Card className="border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
```

### Icons
```
text-emerald-600 → dark:text-emerald-400
```

## Testing Checklist

After applying dark mode to all components:

- [ ] Toggle dark mode in Settings
- [ ] Navigate to each page and verify:
  - [ ] Landing Page
  - [ ] Auth Page  
  - [ ] Dashboard
  - [ ] QuranReader
  - [ ] Group Goals
  - [ ] Group Goal Detail
  - [ ] Settings
  - [ ] Help Page
  - [ ] Milestone Modal
- [ ] Check all interactive states (hover, active, focus)
- [ ] Verify text contrast ratios
- [ ] Test on mobile and desktop
- [ ] Ensure localStorage persistence works
