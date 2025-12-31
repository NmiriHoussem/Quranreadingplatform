# Milestone Modal Integration Guide

## Overview
The milestone system displays beautiful celebration modals when users achieve major milestones like completing a surah memorization or finishing a khatmah.

## Available Milestones

1. **Surah Memorized** - When a user memorizes all ayahs of a surah
2. **Khatmah Completed** - When a user reads all 604 pages of the Quran
3. **First Page** - When a user reads their first page
4. **Halfway Khatmah** - When a user reaches 50% reading progress

## How to Integrate

### Step 1: Import the hook and modal
```tsx
import MilestoneModal from './components/MilestoneModal';
import { useMilestones } from './utils/useMilestones';
```

### Step 2: Use the hook in your component
```tsx
function QuranReader() {
  const {
    currentMilestone,
    checkSurahCompletion,
    checkKhatmahCompletion,
    checkReadingMilestones,
    clearMilestone
  } = useMilestones();

  // ... rest of your component
}
```

### Step 3: Add the modal to your JSX
```tsx
return (
  <div>
    {/* Your existing content */}
    
    {/* Add milestone modal */}
    <MilestoneModal 
      milestone={currentMilestone} 
      onClose={clearMilestone} 
    />
  </div>
);
```

### Step 4: Check for milestones at appropriate times

#### For Surah Memorization:
```tsx
// After marking an ayah as memorized
const handleAyahMemorized = (surahNumber, ayahNumber, totalAyahs, surahName) => {
  markAyahAsMemorized(surahNumber, ayahNumber);
  
  // Check if this completed the surah
  checkSurahCompletion(surahNumber, totalAyahs, surahName);
};
```

#### For Khatmah Completion:
```tsx
// After marking a page as read
const handlePageRead = (pageNumber) => {
  markPageAsRead(pageNumber);
  
  // Check if this completed the khatmah (all 604 pages)
  checkKhatmahCompletion();
  
  // Also check for reading milestones (first page, 50%, etc.)
  checkReadingMilestones();
};
```

## Example: Full Integration in QuranReader

```tsx
import { useState } from 'react';
import { markAyahAsMemorized } from '../utils/localStorage';
import MilestoneModal from './MilestoneModal';
import { useMilestones } from '../utils/useMilestones';

export default function QuranReader() {
  const {
    currentMilestone,
    checkSurahCompletion,
    clearMilestone
  } = useMilestones();

  const handleToggleMemorization = (surahNumber: number, ayahNumber: number) => {
    const totalAyahs = 286; // Example: Surah Al-Baqarah
    const surahName = 'Al-Baqarah';
    
    markAyahAsMemorized(surahNumber, ayahNumber);
    
    // Check if surah is now fully memorized
    checkSurahCompletion(surahNumber, totalAyahs, surahName);
  };

  return (
    <div>
      {/* Your reader content */}
      
      {/* Milestone modal */}
      <MilestoneModal 
        milestone={currentMilestone} 
        onClose={clearMilestone} 
      />
    </div>
  );
}
```

## Features

- ✨ **Animated confetti** celebration
- 🎯 **Islamic-themed** colors and design
- 📖 **Inspiring hadith** quotes
- 🏆 **Achievement icons** (trophy, star, book)
- 🎨 **Smooth animations** with Motion/React
- 🔒 **Prevents duplicates** - same milestone won't trigger twice

## LocalStorage Functions

The following functions are available from `utils/localStorage.ts`:

- `checkAndRecordSurahCompletion(surahNumber, totalAyahs)` - Returns true if newly completed
- `checkKhatmahComplete()` - Returns true if all 604 pages read
- `recordKhatmahCompletion()` - Records and returns khatmah number
- `getMilestoneStats()` - Get counts of achievements

## Customization

You can customize the milestone modal appearance in `/src/app/components/MilestoneModal.tsx`:
- Colors: Update gradient classes
- Icons: Change the icon components
- Quotes: Modify the hadith text
- Animation: Adjust Motion animation properties
