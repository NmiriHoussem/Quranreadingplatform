# Circle Terminology Updates - Implementation Guide

## ✅ Completed Updates

### 1. Translations File (`/src/app/utils/translations.ts`)
- ✅ Added 120+ comprehensive translation strings
- ✅ Changed `anonymousGroups` → `anonymousCircles`
- ✅ Added circle-specific terminology (circles, myCircles, joinCircle, etc.)
- ✅ Added app branding (appName, appNameArabic, tagline)
- ✅ Added navigation, auth, settings, and help strings

### 2. Landing Page (`/src/app/components/LandingPage.tsx`)
- ✅ Updated app name display to use translation strings
- ✅ Changed "Anonymous Groups" card to "Anonymous Circles"
- ✅ Updated footer to say "Quran Circle"

---

## 🔄 Recommended Updates (Not Yet Implemented)

The following files contain "group" terminology that should be updated to "circle" for consistency. These are **suggestions** - implement based on priority.

### High Priority Files

#### 1. `/src/app/components/Auth.tsx`
**Line 274**: 
```tsx
// Current:
Participate in group khatmah challenges and memorization goals

// Suggested:
{t.participateInCircles}
// Translation: "Participate in circle challenges and memorization goals"
```

**Line 25-27**: Update variable names
```tsx
// Current:
const isFromGroupJoin = redirect.includes('/groups/');
const groupType = redirect.includes('khatmah-') ? 'Khatmah' : 'Memorization';

// Suggested:
const isFromCircleJoin = redirect.includes('/circles/');
const circleType = redirect.includes('khatmah-') ? 'Khatmah' : 'Memorization';
```

---

#### 2. `/src/app/components/Dashboard.tsx`
Update these user-facing strings:

**Line 184-185**:
```tsx
// Current:
{/* Current Khatmah Progress - Only show if user is in a Khatmah group */}

// Suggested:
{/* Current Khatmah Progress - Only show if user is in a Khatmah circle */}
```

**Line 219**:
```tsx
// Current:
Join a Khatmah group to track your reading progress and complete the entire Quran together with the community.

// Suggested:
Join a Khatmah circle to track your reading progress and complete the entire Quran together with the community.
```

**Line 348**:
```tsx
// Current:
You've joined {joinedGroups.length} group{joinedGroups.length !== 1 ? 's' : ''}

// Suggested:
You've joined {joinedCircles.length} circle{joinedCircles.length !== 1 ? 's' : ''}
```

**Line 360-362**:
```tsx
// Current:
<h3>Join a Group Goal</h3>
<p>Stay motivated by reading alongside others. Join a Khatmah group to track your progress together.</p>

// Suggested:
<h3>{t.circleGoals}</h3>
<p>Stay motivated by reading alongside others. Join a Khatmah circle to track your progress together.</p>
```

---

#### 3. `/src/app/components/GroupGoals.tsx`
This file should potentially be **renamed** to `CircleGoals.tsx` for consistency.

Update user-facing strings:

**Line 300**:
```tsx
// Current:
placeholder="Search group goals..."

// Suggested:
placeholder="Search circles..."
```

**Line 314**:
```tsx
// Current:
<TabsContent value="my-groups">

// Suggested:
<TabsContent value="my-circles">
```

**Tab labels** (find and update):
```tsx
// Current:
<TabsTrigger value="my-groups">My Groups</TabsTrigger>

// Suggested:
<TabsTrigger value="my-circles">{t.myCircles}</TabsTrigger>
<TabsTrigger value="discover">{t.discoverCircles}</TabsTrigger>
```

**Line 445-447**:
```tsx
// Current:
<h3>About Group Goals</h3>
<p>Group goals are anonymous and focus-driven...</p>

// Suggested:
<h3>{t.aboutCircleGoals}</h3>
<p>Circles are anonymous and focus-driven. Members work together toward shared objectives...</p>
```

**Line 474-477** (Dialog):
```tsx
// Current:
Already in a Khatmah Group
You can only be in one Khatmah reading group at a time. Joining this new group will automatically remove you from your current Khatmah group.

// Suggested:
{t.alreadyInCircle}
{t.switchCircleWarning}
```

---

#### 4. `/src/app/components/GroupGoalDetail.tsx`
Consider renaming to `CircleDetail.tsx`.

**Line 159**:
```tsx
// Current:
// Determine if this is a khatmah or memorization group

// Suggested:
// Determine if this is a khatmah or memorization circle
```

**Line 186**:
```tsx
// Current:
title: 'Group Goal',

// Suggested:
title: t.circles,
```

**Line 321**:
```tsx
// Current:
You're viewing this group as a guest. Join to track your progress with this community.

// Suggested:
{t.viewingAsGuest}. {t.joinToContribute}.
```

**Line 373**:
```tsx
// Current:
Preview of the daily reading schedule. Join this group to track your progress automatically.

// Suggested:
Preview of the daily reading schedule. Join this circle to track your progress automatically.
```

**Line 496-500**:
```tsx
// Current:
{!isMember ? 'Join to Track Progress' : 'About This Group'}
'Join this group to track your personal progress...'
'Work on your memorization goals alongside others in the community.'

// Suggested:
{!isMember ? t.joinToTrackProgress : t.aboutThisCircle}
{!isMember 
  ? 'Join this circle to track your personal progress and be motivated by reading alongside others in the community.'
  : 'Work on your memorization goals alongside others in the circle. Your progress is tracked personally and privately.'
}
```

---

#### 5. `/src/app/components/HelpPage.tsx`

**Line 70-72**:
```tsx
// Current:
<h3>Group Goals</h3>
<p>Join anonymous group challenges for reading and memorization...</p>

// Suggested:
<h3>{t.circleGoals}</h3>
<p>Join anonymous circles for reading and memorization. Stay motivated together without social pressure.</p>
```

**Line 81**:
```tsx
// Current:
Your personal progress is stored locally on your device. Group features only sync what's necessary.

// Suggested:
{t.privacyDescription}
```

**Line 96**:
```tsx
// Current:
To access group goals and real-time presence features, please sign in.

// Suggested:
To access circles and real-time presence features, please sign in.
```

**Line 117**:
```tsx
// Current:
Group Goals: Browse available groups, join challenges...

// Suggested:
{t.circles}: {t.circleFeatures}
```

**Line 132**:
```tsx
// Current:
When you join group goals, we only sync your membership status...

// Suggested:
When you join circles, we only sync your membership status and presence (when you're actively reading) to enable the community features. Your specific progress and statistics remain private.
```

---

#### 6. `/src/app/components/Settings.tsx`

**Lines 105, 111, 117**: Update reset dialog descriptions
```tsx
// Current references to "group memberships"

// Suggested:
• All circle memberships
// In Arabic: • جميع عضويات الحلقات
```

**Line 178**:
```tsx
// Current:
Sign in to access group goals, sync your progress across devices, and join the community.

// Suggested:
Sign in to access circles, sync your progress across devices, and join the community.
```

---

#### 7. `/src/app/components/KhatmahReader.tsx`

**Line 95-96**:
```tsx
// Current:
// Check if user has joined this khatmah group
if (!groupId || !isMemberOfGroup(groupId)) {

// Suggested:
// Check if user has joined this khatmah circle
if (!circleId || !isMemberOfCircle(circleId)) {
```

---

### Medium Priority - Variable Naming

Consider renaming these variables throughout the codebase (use global find/replace carefully):

| Current | Suggested |
|---------|-----------|
| `groupId` | `circleId` |
| `groupType` | `circleType` |
| `joinedGroups` | `joinedCircles` |
| `allGroups` | `allCircles` |
| `myGroupsData` | `myCirclesData` |
| `filteredGroups` | `filteredCircles` |
| `handleJoinGroup` | `handleJoinCircle` |
| `pendingKhatmahGroup` | `pendingKhatmahCircle` |
| `isMemberOfGroup` | `isMemberOfCircle` |
| `leaveGroup` | `leaveCircle` |

**Note**: This requires careful refactoring to avoid breaking functionality. Test thoroughly after each change.

---

### Low Priority - Route Names

**Current URL structure**: `/groups/:id`

**Consider changing to**: `/circles/:id`

This is a **breaking change** that requires:
1. Updating all route definitions
2. Updating all Link components
3. Updating localStorage keys
4. Updating backend routes
5. Migration script for existing users

**Recommendation**: Keep `/groups/` routes for now to avoid breaking existing functionality, but update all user-facing text to say "Circles".

---

## Implementation Strategy

### Phase 1: UI Text Only (Quick Win) ✅ COMPLETED
- ✅ Update translations file
- ✅ Update LandingPage component
- Next: Update all hardcoded user-facing strings to use translation keys

### Phase 2: Component Text Updates (Recommended Next)
1. Update Auth.tsx
2. Update Dashboard.tsx  
3. Update GroupGoals.tsx (keep filename)
4. Update GroupGoalDetail.tsx (keep filename)
5. Update HelpPage.tsx
6. Update Settings.tsx

### Phase 3: Variable Renaming (Optional)
- Rename internal variables for consistency
- Keep this internal - doesn't affect users

### Phase 4: Route Renaming (Future consideration)
- Only if you want clean URLs
- Requires migration planning

---

## Testing Checklist

After implementing updates, test:
- [ ] Landing page displays "Quran Circle" branding
- [ ] All user-facing text says "circle" not "group"
- [ ] Arabic translations display correctly
- [ ] Language toggle works properly
- [ ] Navigation still functions (routes unchanged)
- [ ] Circle join/leave functionality still works
- [ ] Dialogs and alerts show correct terminology

---

**Priority**: Implement **Phase 2** next for maximum brand consistency with minimal code changes.
