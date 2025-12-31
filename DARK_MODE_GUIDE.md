# Dark Mode Implementation Guide

## Overview
A beautiful, Islamic-themed dark mode system with emerald greens optimized for Quran reading at night.

## Features
✅ **Automatic persistence** - Preference saved to localStorage
✅ **System preference detection** - Falls back to user's OS theme
✅ **Smooth transitions** - Instant toggle without flicker
✅ **Islamic color palette** - Calming emerald greens and warm golds
✅ **Global hook** - Centralized state management
✅ **Optimized for reading** - Easy on the eyes during night prayer

## Color Palette

### Light Mode
- Background: `#ffffff` → Soft white
- Foreground: Dark text
- Primary: `#10b981` (Emerald-600)
- Accents: Emerald greens with gold highlights

### Dark Mode
- Background: `#0a1810` → Deep forest green
- Foreground: `#e8f5ee` → Soft cream white
- Primary: `#34d399` → Bright emerald
- Accents: Muted emerald tones
- Cards: `#0f1f16` → Slightly lighter than background
- Borders: `#1e4d36` → Subtle emerald borders

## Usage

### In Any Component
```tsx
import { useDarkMode } from '../utils/useDarkMode';

function MyComponent() {
  const { isDarkMode, toggleDarkMode, setDarkMode } = useDarkMode();

  return (
    <div className="bg-white dark:bg-emerald-950">
      <button onClick={toggleDarkMode}>
        Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  );
}
```

### Tailwind Class Pattern
Always use the `dark:` variant for dark mode styling:

```tsx
// Text colors
className="text-emerald-900 dark:text-emerald-100"

// Backgrounds
className="bg-white dark:bg-emerald-950"

// Borders
className="border-emerald-100 dark:border-emerald-800"

// Buttons
className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"

// Gradients
className="from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900"
```

## Best Practices

### 1. Use Semantic Color Naming
```tsx
// ✅ Good
className="text-foreground bg-background"

// ❌ Avoid
className="text-black dark:text-white"
```

### 2. Consistent Card Styling
```tsx
<Card className="border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
```

### 3. Maintain Contrast Ratios
- Light mode: Dark text on light backgrounds
- Dark mode: Light text on dark backgrounds
- Ensure WCAG AA compliance (4.5:1 minimum)

### 4. Test Both Modes
Always test your UI in both light and dark modes before committing.

## File Structure

```
/src
  /app
    /utils
      useDarkMode.ts          # Global dark mode hook
  /styles
    theme.css                 # Dark mode CSS variables
```

## CSS Variables

The theme is built on CSS custom properties that automatically switch:

```css
:root {
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --primary: #030213;
  /* ... */
}

.dark {
  --background: #0a1810;
  --foreground: #e8f5ee;
  --primary: #34d399;
  /* ... */
}
```

## localStorage Key

Dark mode preference is stored at:
```
key: 'quran_companion_dark_mode'
value: 'true' | 'false'
```

## Initialization Flow

1. **App starts** → `useDarkMode()` hook initializes
2. **Check localStorage** → Read saved preference
3. **Fallback to system** → Use OS preference if no saved value
4. **Apply class** → Add/remove `.dark` class on `<html>`
5. **Save changes** → Persist to localStorage on toggle

## Common Components

### Settings Page
The dark mode toggle is in `/src/app/components/Settings.tsx`:
- Shows Moon icon when dark mode is ON
- Shows Sun icon when light mode is ON
- Descriptive help text changes based on mode

### All Pages Support
Current dark mode support:
- ✅ Dashboard
- ✅ Settings
- ✅ Milestone Modal
- 🔄 QuranReader (needs implementation)
- 🔄 GroupGoals (needs implementation)
- 🔄 Auth pages (needs implementation)

## Extending Dark Mode

### Adding Dark Mode to a New Component

1. **Add dark: variants** to all color classes
2. **Test readability** in both modes
3. **Check icons and images** for visibility
4. **Verify buttons and links** have proper hover states

Example:
```tsx
export default function NewComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">
      <Card className="p-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
        <h2 className="text-xl text-emerald-900 dark:text-emerald-100">
          Title
        </h2>
        <p className="text-emerald-600 dark:text-emerald-400">
          Description text
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
          Action
        </Button>
      </Card>
    </div>
  );
}
```

## Troubleshooting

### Dark mode not applying?
- Check that `.dark` class is on `<html>` element
- Verify Tailwind is configured for dark mode
- Clear localStorage and test again

### Flashing on page load?
- The `useDarkMode` hook runs on mount to prevent flicker
- Class is applied before first paint

### Colors not updating?
- Ensure you're using CSS variables from theme.css
- Check that dark: variants are properly applied

## Performance

- **Zero runtime overhead** - Uses CSS only
- **Instant toggle** - No re-renders needed
- **Persistent** - Survives page refreshes
- **Optimized** - Only updates when necessary

## Accessibility

- ✅ Respects `prefers-color-scheme` media query
- ✅ High contrast ratios maintained
- ✅ Focus states visible in both modes
- ✅ User preference takes priority over system

## Future Enhancements

Potential improvements:
- [ ] Auto-switch based on time of day
- [ ] Separate mode for Quran reading (sepia tone)
- [ ] Custom color theme selection
- [ ] Smooth color transition animations
