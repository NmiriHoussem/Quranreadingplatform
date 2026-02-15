// localStorage management for personal Quran reading progress

// Import sync function at the top
let triggerSync: (() => void) | null = null;

// Import SURAHS for verse count lookups
import { SURAHS } from './surahs';

// Allow external code to set the sync trigger
export const setSyncTrigger = (syncFn: () => void): void => {
  triggerSync = syncFn;
};

export interface ReadingProgress {
  [pageNumber: string]: {
    completed: boolean;
    timestamp: string;
  };
}

export interface MemorizedAyah {
  surahNumber: number;
  ayahNumber: number;
  timestamp: string;
}

export interface MemorizationProgress {
  [surahNumber: string]: {
    [ayahNumber: string]: {
      memorized: boolean;
      timestamp: string;
    };
  };
}

export interface UserData {
  readingProgress: ReadingProgress;
  memorizationProgress: MemorizationProgress;
  groups: string[]; // Changed from joinedGroups to groups for consistency
  lastRead: { surahNumber: number; ayahNumber: number; timestamp: string } | null;
  juzProgress: { [juzNumber: string]: { completed: boolean; timestamp: string } };
  completedSurahs: number[];
  
  // DEPRECATED: Old structure - keeping for backward compatibility
  khatmahProgress?: { [groupId: string]: ReadingProgress };
  
  // NEW: Separate public and private progress
  publicKhatmahProgress: { [groupId: string]: ReadingProgress };
  privateKhatmahsUnifiedProgress: {
    pagesRead: ReadingProgress;
    khatmahIds: string[];
    lastUpdated: string;
  };
  
  completedKhatmahs?: Array<{ groupId: string; completedAt: string }>; // New field for completed khatmahs
}

export interface MilestoneRecord {
  type: string;
  timestamp: string;
  data?: any;
}

export interface KhatmahRecord {
  completedAt: string;
  number: number;
}

const STORAGE_KEY = 'quran_companion_data';

// Initialize default data
const getDefaultData = (): UserData => ({
  readingProgress: {},
  memorizationProgress: {},
  groups: [],
  lastRead: null,
  juzProgress: {},
  completedSurahs: [],
  khatmahProgress: {},
  publicKhatmahProgress: {},
  privateKhatmahsUnifiedProgress: {
    pagesRead: {},
    khatmahIds: [],
    lastUpdated: new Date().toISOString()
  }
});

// Get all user data
export const getUserData = (): UserData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return getDefaultData();
    const parsed = JSON.parse(data);
    
    // Ensure backward compatibility by merging with defaults
    const defaults = getDefaultData();
    return {
      ...defaults,
      ...parsed,
      // Ensure arrays exist
      groups: parsed.groups || [],
      completedSurahs: parsed.completedSurahs || [],
      khatmahProgress: parsed.khatmahProgress || {},
      publicKhatmahProgress: parsed.publicKhatmahProgress || {},
      privateKhatmahsUnifiedProgress: parsed.privateKhatmahsUnifiedProgress || {
        pagesRead: {},
        khatmahIds: [],
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error reading localStorage:', error);
    return getDefaultData();
  }
};

// Save all user data
export const saveUserData = (data: UserData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Trigger sync if available (when user is authenticated)
    if (triggerSync) {
      triggerSync();
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Mark a page as read
export const markPageAsRead = (pageNumber: number): void => {
  const data = getUserData();
  
  // Mark the current page as read
  data.readingProgress[pageNumber.toString()] = {
    completed: true,
    timestamp: new Date().toISOString()
  };
  
  // In the context of Khatmah reading, if marking a page as read,
  // all previous pages should also be marked as read (sequential reading)
  // Mark all pages from 1 to (pageNumber - 1) as read if not already marked
  let autoMarkedCount = 0;
  for (let page = 1; page < pageNumber; page++) {
    if (!data.readingProgress[page.toString()]?.completed) {
      data.readingProgress[page.toString()] = {
        completed: true,
        timestamp: new Date().toISOString()
      };
      autoMarkedCount++;
    }
  }
  
  if (autoMarkedCount > 0) {
    console.log(`✅ Marked page ${pageNumber} as read + auto-marked ${autoMarkedCount} previous pages (1-${pageNumber - 1})`);
  } else {
    console.log(`✅ Marked page ${pageNumber} as read`);
  }
  
  saveUserData(data);
};

// Check if a page is read
export const isPageRead = (pageNumber: number): boolean => {
  const data = getUserData();
  return data.readingProgress[pageNumber.toString()]?.completed || false;
};

// Get all read pages
export const getReadPages = (): number[] => {
  const data = getUserData();
  return Object.keys(data.readingProgress)
    .filter(key => data.readingProgress[key].completed)
    .map(key => parseInt(key))
    .sort((a, b) => a - b);
};

// Check if a range of pages is complete
export const isPagesRangeComplete = (startPage: number, endPage: number): boolean => {
  const data = getUserData();
  for (let page = startPage; page <= endPage; page++) {
    if (!data.readingProgress[page.toString()]?.completed) {
      return false;
    }
  }
  return true;
};

// Join a group
export const joinGroup = (groupId: string): void => {
  const data = getUserData();
  
  // If joining a khatmah group and user already has a current khatmah, prevent joining
  if (groupId.startsWith('khatmah-') && data.groups.includes('khatmah-')) {
    throw new Error('You can only join one Khatmah at a time. Please leave your current Khatmah first.');
  }
  
  if (!data.groups.includes(groupId)) {
    data.groups.push(groupId);
    
    // If joining a khatmah group, set as current khatmah
    if (groupId.startsWith('khatmah-')) {
      data.groups = data.groups.filter(id => !id.startsWith('khatmah-'));
      data.groups.push(groupId);
    }
    
    saveUserData(data);
  }
};

// Leave a group
export const leaveGroup = (groupId: string): void => {
  const data = getUserData();
  data.groups = data.groups.filter(id => id !== groupId);
  
  // If leaving current khatmah, clear it
  if (data.groups.includes('khatmah-')) {
    data.groups = data.groups.filter(id => !id.startsWith('khatmah-'));
  }
  
  saveUserData(data);
};

// Switch khatmah groups (leave old, join new)
export const switchKhatmahGroup = (newKhatmahId: string): void => {
  const data = getUserData();
  
  // Find current khatmah
  const currentKhatmah = data.groups.find(id => id.startsWith('khatmah-'));
  
  // Transfer progress from old khatmah to new khatmah
  if (currentKhatmah && data.khatmahProgress[currentKhatmah]) {
    // Copy all progress from old khatmah to new khatmah
    // This preserves all the pages the user has read
    data.khatmahProgress[newKhatmahId] = { ...data.khatmahProgress[currentKhatmah] };
    
    // Delete old khatmah progress
    delete data.khatmahProgress[currentKhatmah];
  }
  
  // Remove old khatmah from groups
  data.groups = data.groups.filter(id => !id.startsWith('khatmah-'));
  
  // Add new khatmah
  if (!data.groups.includes(newKhatmahId)) {
    data.groups.push(newKhatmahId);
  }
  
  saveUserData(data);
};

// Get joined groups
export const getJoinedGroups = (): string[] => {
  const data = getUserData();
  return data.groups;
};

// Get current khatmah
export const getCurrentKhatmah = (): string | null => {
  const data = getUserData();
  const khatmahGroup = data.groups.find(id => id.startsWith('khatmah-'));
  return khatmahGroup || null;
};

// Check if user is member of a group
export const isMemberOfGroup = (groupId: string): boolean => {
  const data = getUserData();
  return data.groups.includes(groupId);
};

// Get reading statistics
export const getReadingStats = () => {
  const readPages = getReadPages();
  const totalPages = 604;
  const pagesRead = readPages.length;
  const percentComplete = Math.round((pagesRead / totalPages) * 100);
  
  return {
    pagesRead,
    totalPages,
    percentComplete,
    lastReadPage: readPages[readPages.length - 1] || 1
  };
};

// Calculate khatmah milestones based on reading progress
export const calculateKhatmahMilestones = (days: number) => {
  const totalPages = 604;
  const pagesPerDay = Math.ceil(totalPages / days);
  const milestones = [];
  
  for (let day = 1; day <= days; day++) {
    const startPage = (day - 1) * pagesPerDay + 1;
    const endPage = Math.min(day * pagesPerDay, totalPages);
    const isComplete = isPagesRangeComplete(startPage, endPage);
    
    const startJuz = Math.ceil(startPage / 20);
    const endJuz = Math.ceil(endPage / 20);
    
    milestones.push({
      day,
      title: `Day ${day}`,
      description: `Pages ${startPage}-${endPage} (Juz ${startJuz}${startJuz !== endJuz ? `-${endJuz}` : ''})`,
      pagesRange: `${startPage}-${endPage}`,
      startPage,
      endPage,
      completed: isComplete
    });
  }
  
  return milestones;
};

// Clear all data (for testing)
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// ===== MEMORIZATION FUNCTIONS =====

// Mark an ayah as memorized
export const markAyahAsMemorized = (surahNumber: number, ayahNumber: number): void => {
  const data = getUserData();
  
  if (!data.memorizationProgress[surahNumber.toString()]) {
    data.memorizationProgress[surahNumber.toString()] = {};
  }
  
  data.memorizationProgress[surahNumber.toString()][ayahNumber.toString()] = {
    memorized: true,
    timestamp: new Date().toISOString()
  };
  
  // Check if this surah is now complete and auto-add to completedSurahs
  const surahInfo = SURAHS.find(s => s.number === surahNumber);
  if (surahInfo) {
    const memorizedAyahs = Object.keys(data.memorizationProgress[surahNumber.toString()] || {}).length;
    if (memorizedAyahs === surahInfo.verses && !data.completedSurahs.includes(surahNumber)) {
      data.completedSurahs.push(surahNumber);
      console.log(`🎉 Surah ${surahNumber} auto-completed! All ${surahInfo.verses} ayahs memorized.`);
    }
  }
  
  // Save once (this triggers both localStorage and database sync)
  saveUserData(data);
};

// Unmark an ayah as memorized
export const unmarkAyahAsMemorized = (surahNumber: number, ayahNumber: number): void => {
  const data = getUserData();
  
  if (data.memorizationProgress[surahNumber.toString()]) {
    delete data.memorizationProgress[surahNumber.toString()][ayahNumber.toString()];
    saveUserData(data);
  }
};

// Check if an ayah is memorized
export const isAyahMemorized = (surahNumber: number, ayahNumber: number): boolean => {
  const data = getUserData();
  return data.memorizationProgress[surahNumber.toString()]?.[ayahNumber.toString()]?.memorized || false;
};

// Mark entire surah as memorized
export const markEntireSurahAsMemorized = (surahNumber: number, totalAyahs: number): void => {
  const data = getUserData();
  
  if (!data.memorizationProgress[surahNumber.toString()]) {
    data.memorizationProgress[surahNumber.toString()] = {};
  }
  
  // Mark all ayahs as memorized
  for (let ayahNumber = 1; ayahNumber <= totalAyahs; ayahNumber++) {
    data.memorizationProgress[surahNumber.toString()][ayahNumber.toString()] = {
      memorized: true,
      timestamp: new Date().toISOString()
    };
  }
  
  // Record surah completion if not already recorded
  if (!data.completedSurahs.includes(surahNumber)) {
    data.completedSurahs.push(surahNumber);
  }
  
  saveUserData(data);
};

// Get all memorized ayahs for a surah
export const getMemorizedAyahs = (surahNumber: number): number[] => {
  const data = getUserData();
  const surahData = data.memorizationProgress[surahNumber.toString()];
  
  if (!surahData) return [];
  
  return Object.keys(surahData)
    .filter(key => surahData[key].memorized)
    .map(key => parseInt(key))
    .sort((a, b) => a - b);
};

// Get the last memorized ayah for a surah (to resume from)
export const getLastMemorizedAyah = (surahNumber: number): number | null => {
  const memorizedAyahs = getMemorizedAyahs(surahNumber);
  
  if (memorizedAyahs.length === 0) return null;
  
  return memorizedAyahs[memorizedAyahs.length - 1];
};

// Mark all ayahs on a specific page as memorized
export const markPageAsMemorized = (pageNumber: number, verses: Array<{verse_key: string}>): void => {
  const data = getUserData();
  
  // Mark each ayah on this page as memorized
  verses.forEach(verse => {
    const [surahStr, ayahStr] = verse.verse_key.split(':');
    const surahNumber = parseInt(surahStr);
    const ayahNumber = parseInt(ayahStr);
    
    if (!data.memorizationProgress[surahNumber.toString()]) {
      data.memorizationProgress[surahNumber.toString()] = {};
    }
    
    data.memorizationProgress[surahNumber.toString()][ayahNumber.toString()] = {
      memorized: true,
      timestamp: new Date().toISOString()
    };
  });
  
  // Check for auto-completed surahs
  const affectedSurahs = new Set(verses.map(v => parseInt(v.verse_key.split(':')[0])));
  affectedSurahs.forEach(surahNumber => {
    const surahInfo = SURAHS.find(s => s.number === surahNumber);
    if (surahInfo) {
      const memorizedAyahs = Object.keys(data.memorizationProgress[surahNumber.toString()] || {}).length;
      if (memorizedAyahs === surahInfo.verses && !data.completedSurahs.includes(surahNumber)) {
        data.completedSurahs.push(surahNumber);
        console.log(`🎉 Surah ${surahNumber} auto-completed! All ${surahInfo.verses} ayahs memorized.`);
      }
    }
  });
  
  // Save once (this triggers both localStorage and database sync)
  saveUserData(data);
  console.log(`✅ Marked ${verses.length} ayahs on page ${pageNumber} as memorized`);
};

// Check if all ayahs on a page are memorized
export const isPageMemorized = (pageNumber: number, verses: Array<{verse_key: string}>): boolean => {
  return verses.every(verse => {
    const [surahStr, ayahStr] = verse.verse_key.split(':');
    const surahNumber = parseInt(surahStr);
    const ayahNumber = parseInt(ayahStr);
    return isAyahMemorized(surahNumber, ayahNumber);
  });
};

// Unmark all ayahs on a specific page as memorized
export const unmarkPageAsMemorized = (pageNumber: number, verses: Array<{verse_key: string}>): void => {
  const data = getUserData();
  
  verses.forEach(verse => {
    const [surahStr, ayahStr] = verse.verse_key.split(':');
    const surahNumber = parseInt(surahStr);
    const ayahNumber = parseInt(ayahStr);
    
    if (data.memorizationProgress[surahNumber.toString()]) {
      delete data.memorizationProgress[surahNumber.toString()][ayahNumber.toString()];
    }
  });
  
  saveUserData(data);
  console.log(`✅ Unmarked ${verses.length} ayahs on page ${pageNumber} as memorized`);
};

// Get memorization statistics for a surah
export const getSurahMemorizationStats = (surahNumber: number, totalAyahs: number) => {
  const memorizedAyahs = getMemorizedAyahs(surahNumber);
  const ayahsMemorized = memorizedAyahs.length;
  const percentComplete = Math.round((ayahsMemorized / totalAyahs) * 100);
  
  return {
    ayahsMemorized,
    totalAyahs,
    percentComplete,
    lastMemorizedAyah: getLastMemorizedAyah(surahNumber)
  };
};

// ===== MILESTONE TRACKING =====

// Check if a surah is fully memorized
export const isSurahFullyMemorized = (surahNumber: number, totalAyahs: number): boolean => {
  const memorizedAyahs = getMemorizedAyahs(surahNumber);
  return memorizedAyahs.length === totalAyahs;
};

// Record a milestone achievement
export const recordMilestone = (type: string, data?: any): void => {
  const userData = getUserData();
  
  // Check if this milestone was already recorded (avoid duplicates)
  const existingMilestone = userData.milestones.find(
    m => m.type === type && JSON.stringify(m.data) === JSON.stringify(data)
  );
  
  if (!existingMilestone) {
    userData.milestones.push({
      type,
      timestamp: new Date().toISOString(),
      data
    });
    saveUserData(userData);
  }
};

// Check if khatmah is complete
export const checkKhatmahComplete = (): boolean => {
  const readPages = getReadPages();
  return readPages.length === 604;
};

// Record khatmah completion
export const recordKhatmahCompletion = (): number => {
  const data = getUserData();
  const khatmahNumber = data.khatmahs.length + 1;
  
  data.khatmahs.push({
    completedAt: new Date().toISOString(),
    number: khatmahNumber
  });
  
  saveUserData(data);
  return khatmahNumber;
};

// Check and record surah completion
export const checkAndRecordSurahCompletion = (surahNumber: number, totalAyahs: number): boolean => {
  const data = getUserData();
  
  // Check if surah is fully memorized and not already recorded
  if (isSurahFullyMemorized(surahNumber, totalAyahs) && !data.completedSurahs.includes(surahNumber)) {
    data.completedSurahs.push(surahNumber);
    saveUserData(data);
    return true; // Newly completed
  }
  
  return false;
};

// Get milestone stats
export const getMilestoneStats = () => {
  const data = getUserData();
  return {
    khatmahs: data.khatmahs?.length || 0,
    completedSurahs: data.completedSurahs?.length || 0,
    milestones: data.milestones?.length || 0
  };
};

// Check for reading milestones (50%, 75%, etc.)
export const checkReadingMilestone = (): string | null => {
  const stats = getReadingStats();
  const data = getUserData();
  
  // Check for specific percentage milestones
  if (stats.percentComplete === 1 && !data.milestones.find(m => m.type === 'first_page')) {
    return 'first_page';
  }
  if (stats.percentComplete === 50 && !data.milestones.find(m => m.type === 'halfway_khatmah')) {
    return 'halfway_khatmah';
  }
  
  return null;
};

// ===== KHATMAH-SPECIFIC PROGRESS FUNCTIONS =====

// Mark a page as read in a specific khatmah (AUTO-DETECTS private vs public)
export const markKhatmahPageAsRead = (groupId: string, pageNumber: number): void => {
  // Check if this is a private khatmah
  if (isPrivateKhatmah(groupId)) {
    markPrivateKhatmahPageAsRead(groupId, pageNumber);
  } else {
    markPublicKhatmahPageAsRead(groupId, pageNumber);
  }
};

// Check if a page is read in a specific khatmah (AUTO-DETECTS private vs public)
export const isKhatmahPageRead = (groupId: string, pageNumber: number): boolean => {
  // Check if this is a private khatmah
  if (isPrivateKhatmah(groupId)) {
    return isPrivateKhatmahPageRead(groupId, pageNumber);
  } else {
    return isPublicKhatmahPageRead(groupId, pageNumber);
  }
};

// Get all read pages for a specific khatmah (AUTO-DETECTS private vs public)
export const getKhatmahReadPages = (groupId: string): number[] => {
  // Check if this is a private khatmah
  if (isPrivateKhatmah(groupId)) {
    return getPrivateKhatmahReadPages();
  } else {
    return getPublicKhatmahReadPages(groupId);
  }
};

// Check if a range of pages is complete in a specific khatmah (AUTO-DETECTS private vs public)
export const isKhatmahPagesRangeComplete = (groupId: string, startPage: number, endPage: number): boolean => {
  // Check if this is a private khatmah
  if (isPrivateKhatmah(groupId)) {
    return isPrivateKhatmahPagesRangeComplete(startPage, endPage);
  } else {
    return isPublicKhatmahPagesRangeComplete(groupId, startPage, endPage);
  }
};

// Calculate khatmah milestones based on khatmah-specific reading progress (AUTO-DETECTS private vs public)
export const calculateKhatmahMilestonesForGroup = (groupId: string, days: number) => {
  // Check if this is a private khatmah
  if (isPrivateKhatmah(groupId)) {
    return calculatePrivateKhatmahMilestones(days);
  } else {
    return calculatePublicKhatmahMilestones(groupId, days);
  }
};

// Get reading statistics for a specific khatmah
export const getKhatmahReadingStats = (groupId: string) => {
  const readPages = getKhatmahReadPages(groupId);
  const totalPages = 604;
  const pagesRead = readPages.length;
  const percentComplete = Math.round((pagesRead / totalPages) * 100);
  
  return {
    pagesRead,
    totalPages,
    percentComplete,
    lastReadPage: readPages[readPages.length - 1] || 1
  };
};

// ===== MEMORIZATION GROUPS FUNCTIONS =====

// Get all joined memorization groups
export const getJoinedMemorizationGroups = (): string[] => {
  const data = getUserData();
  return data.groups.filter(groupId => groupId.startsWith('surah-'));
};

// ===== RESET FUNCTIONS =====

// Reset all progress (complete wipeout)
export const resetAllProgress = (): void => {
  const defaultData = getDefaultData();
  saveUserData(defaultData);
  console.log('All progress has been reset');
};

// Reset only reading progress (keep memorization and groups)
export const resetReadingProgress = async (): Promise<void> => {
  const data = getUserData();
  
  console.log('Before reset - readingProgress:', Object.keys(data.readingProgress).length, 'pages');
  console.log('Before reset - khatmahProgress:', Object.keys(data.khatmahProgress));
  
  data.readingProgress = {};
  data.khatmahProgress = {};
  // Keep all group memberships (both khatmah and memorization)
  
  saveUserData(data);
  
  console.log('After reset - localStorage saved');
  
  // Verify it was saved correctly
  const verifyData = getUserData();
  console.log('Verification - readingProgress:', Object.keys(verifyData.readingProgress).length, 'pages');
  console.log('Verification - khatmahProgress:', Object.keys(verifyData.khatmahProgress));
  console.log('Verification - groups:', verifyData.groups);
  
  console.log('Reading progress has been reset');
};

// Reset only memorization progress (keep reading and groups)
export const resetMemorizationProgress = (): void => {
  const data = getUserData();
  data.memorizationProgress = {};
  data.completedSurahs = [];
  saveUserData(data);
  console.log('Memorization progress has been reset');
};

// Reset specific khatmah progress
export const resetKhatmahProgress = (groupId: string): void => {
  const data = getUserData();
  if (data.khatmahProgress[groupId]) {
    delete data.khatmahProgress[groupId];
    saveUserData(data);
    console.log(`Khatmah ${groupId} progress has been reset`);
  }
};

// Reset specific surah memorization
export const resetSurahMemorization = (surahNumber: number): void => {
  const data = getUserData();
  if (data.memorizationProgress[surahNumber.toString()]) {
    delete data.memorizationProgress[surahNumber.toString()];
    // Remove from completed surahs if present
    data.completedSurahs = data.completedSurahs.filter(num => num !== surahNumber);
    saveUserData(data);
    console.log(`Surah ${surahNumber} memorization has been reset`);
  }
};

// Export data for backup (before reset)
export const exportProgressData = (): string => {
  const data = getUserData();
  return JSON.stringify(data, null, 2);
};

// ===== PRIVATE KHATMAH UNIFIED PROGRESS FUNCTIONS =====

// Store private khatmah IDs metadata
const PRIVATE_KHATMAH_IDS_KEY = 'private_khatmah_ids';

// Get all private khatmah IDs from localStorage metadata
export const getPrivateKhatmahIds = (): string[] => {
  try {
    const stored = localStorage.getItem(PRIVATE_KHATMAH_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save private khatmah IDs to localStorage metadata
const savePrivateKhatmahIds = (ids: string[]): void => {
  localStorage.setItem(PRIVATE_KHATMAH_IDS_KEY, JSON.stringify(ids));
};

// Check if a khatmah is private
export const isPrivateKhatmah = (groupId: string): boolean => {
  const privateIds = getPrivateKhatmahIds();
  return privateIds.includes(groupId);
};

// Initialize unified private progress (first private khatmah join)
export const initializePrivateKhatmahProgress = (
  startFromScratch: boolean,
  copyFromPublicId?: string
): void => {
  const data = getUserData();
  
  if (startFromScratch) {
    // Start with empty progress
    data.privateKhatmahsUnifiedProgress = {
      pagesRead: {},
      khatmahIds: [],
      lastUpdated: new Date().toISOString()
    };
  } else if (copyFromPublicId && data.publicKhatmahProgress[copyFromPublicId]) {
    // Copy from public khatmah
    data.privateKhatmahsUnifiedProgress = {
      pagesRead: { ...data.publicKhatmahProgress[copyFromPublicId] },
      khatmahIds: [],
      lastUpdated: new Date().toISOString()
    };
    console.log(`✅ Copied progress from public khatmah ${copyFromPublicId} to private khatmahs`);
  } else {
    // Fallback: start from scratch
    data.privateKhatmahsUnifiedProgress = {
      pagesRead: {},
      khatmahIds: [],
      lastUpdated: new Date().toISOString()
    };
  }
  
  saveUserData(data);
};

// Join a private khatmah (adds to unified progress)
export const joinPrivateKhatmah = (khatmahId: string): void => {
  const data = getUserData();
  const privateIds = getPrivateKhatmahIds();
  
  // Add to unified khatmah IDs
  if (!data.privateKhatmahsUnifiedProgress.khatmahIds.includes(khatmahId)) {
    data.privateKhatmahsUnifiedProgress.khatmahIds.push(khatmahId);
    data.privateKhatmahsUnifiedProgress.lastUpdated = new Date().toISOString();
  }
  
  // Add to metadata
  if (!privateIds.includes(khatmahId)) {
    privateIds.push(khatmahId);
    savePrivateKhatmahIds(privateIds);
  }
  
  // Add to groups if not already there
  if (!data.groups.includes(khatmahId)) {
    data.groups.push(khatmahId);
  }
  
  saveUserData(data);
  console.log(`✅ Joined private khatmah: ${khatmahId}`);
};

// Leave a private khatmah
export const leavePrivateKhatmah = (khatmahId: string): void => {
  const data = getUserData();
  const privateIds = getPrivateKhatmahIds();
  
  // Remove from unified khatmah IDs
  data.privateKhatmahsUnifiedProgress.khatmahIds = 
    data.privateKhatmahsUnifiedProgress.khatmahIds.filter(id => id !== khatmahId);
  data.privateKhatmahsUnifiedProgress.lastUpdated = new Date().toISOString();
  
  // Remove from metadata
  const updatedPrivateIds = privateIds.filter(id => id !== khatmahId);
  savePrivateKhatmahIds(updatedPrivateIds);
  
  // Remove from groups
  data.groups = data.groups.filter(id => id !== khatmahId);
  
  saveUserData(data);
  console.log(`✅ Left private khatmah: ${khatmahId}`);
};

// Mark a page as read in a private khatmah (updates unified progress)
export const markPrivateKhatmahPageAsRead = (khatmahId: string, pageNumber: number): void => {
  const data = getUserData();
  
  // Mark in unified private progress
  data.privateKhatmahsUnifiedProgress.pagesRead[pageNumber.toString()] = {
    completed: true,
    timestamp: new Date().toISOString()
  };
  
  // Mark all previous pages as read (sequential reading)
  for (let page = 1; page < pageNumber; page++) {
    if (!data.privateKhatmahsUnifiedProgress.pagesRead[page.toString()]?.completed) {
      data.privateKhatmahsUnifiedProgress.pagesRead[page.toString()] = {
        completed: true,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  data.privateKhatmahsUnifiedProgress.lastUpdated = new Date().toISOString();
  
  saveUserData(data);
  console.log(`✅ Marked page ${pageNumber} as read in private khatmah (synced across all private khatmahs)`);
};

// Mark a page as read in a public khatmah
export const markPublicKhatmahPageAsRead = (groupId: string, pageNumber: number): void => {
  const data = getUserData();
  
  if (!data.publicKhatmahProgress[groupId]) {
    data.publicKhatmahProgress[groupId] = {};
  }
  
  // Mark the current page as read
  data.publicKhatmahProgress[groupId][pageNumber.toString()] = {
    completed: true,
    timestamp: new Date().toISOString()
  };
  
  // Mark all previous pages as read (sequential reading)
  for (let page = 1; page < pageNumber; page++) {
    if (!data.publicKhatmahProgress[groupId][page.toString()]?.completed) {
      data.publicKhatmahProgress[groupId][page.toString()] = {
        completed: true,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  saveUserData(data);
  console.log(`✅ Marked page ${pageNumber} as read in public khatmah ${groupId}`);
};

// Check if a page is read in a private khatmah (uses unified progress)
export const isPrivateKhatmahPageRead = (khatmahId: string, pageNumber: number): boolean => {
  const data = getUserData();
  return data.privateKhatmahsUnifiedProgress.pagesRead[pageNumber.toString()]?.completed || false;
};

// Check if a page is read in a public khatmah
export const isPublicKhatmahPageRead = (groupId: string, pageNumber: number): boolean => {
  const data = getUserData();
  return data.publicKhatmahProgress[groupId]?.[pageNumber.toString()]?.completed || false;
};

// Get all read pages for private khatmahs (unified)
export const getPrivateKhatmahReadPages = (): number[] => {
  const data = getUserData();
  const pagesRead = data.privateKhatmahsUnifiedProgress.pagesRead;
  
  return Object.keys(pagesRead)
    .filter(key => pagesRead[key].completed)
    .map(key => parseInt(key))
    .sort((a, b) => a - b);
};

// Get all read pages for a public khatmah
export const getPublicKhatmahReadPages = (groupId: string): number[] => {
  const data = getUserData();
  const khatmahData = data.publicKhatmahProgress[groupId];
  
  if (!khatmahData) return [];
  
  return Object.keys(khatmahData)
    .filter(key => khatmahData[key].completed)
    .map(key => parseInt(key))
    .sort((a, b) => a - b);
};

// Get reading statistics for private khatmahs (unified)
export const getPrivateKhatmahReadingStats = () => {
  const readPages = getPrivateKhatmahReadPages();
  const totalPages = 604;
  const pagesRead = readPages.length;
  const percentComplete = Math.round((pagesRead / totalPages) * 100);
  
  return {
    pagesRead,
    totalPages,
    percentComplete,
    lastReadPage: readPages[readPages.length - 1] || 1
  };
};

// Get raw private khatmah progress data (for syncing to database)
export const getPrivateKhatmahProgressData = () => {
  const data = getUserData();
  return {
    pagesRead: data.privateKhatmahsUnifiedProgress.pagesRead,
    percentComplete: getPrivateKhatmahReadingStats().percentComplete,
    lastUpdated: data.privateKhatmahsUnifiedProgress.lastUpdated
  };
};

// Get reading statistics for a public khatmah
export const getPublicKhatmahReadingStats = (groupId: string) => {
  const readPages = getPublicKhatmahReadPages(groupId);
  const totalPages = 604;
  const pagesRead = readPages.length;
  const percentComplete = Math.round((pagesRead / totalPages) * 100);
  
  return {
    pagesRead,
    totalPages,
    percentComplete,
    lastReadPage: readPages[readPages.length - 1] || 1
  };
};

// Check if a range of pages is complete in private khatmahs
export const isPrivateKhatmahPagesRangeComplete = (startPage: number, endPage: number): boolean => {
  const data = getUserData();
  const pagesRead = data.privateKhatmahsUnifiedProgress.pagesRead;
  
  for (let page = startPage; page <= endPage; page++) {
    if (!pagesRead[page.toString()]?.completed) {
      return false;
    }
  }
  return true;
};

// Check if a range of pages is complete in public khatmah
export const isPublicKhatmahPagesRangeComplete = (groupId: string, startPage: number, endPage: number): boolean => {
  const data = getUserData();
  const khatmahData = data.publicKhatmahProgress[groupId];
  
  if (!khatmahData) return false;
  
  for (let page = startPage; page <= endPage; page++) {
    if (!khatmahData[page.toString()]?.completed) {
      return false;
    }
  }
  return true;
};

// Calculate milestones for private khatmahs (unified progress)
export const calculatePrivateKhatmahMilestones = (days: number) => {
  const totalPages = 604;
  const pagesPerDay = Math.floor(totalPages / days); // Use floor instead of ceil
  const remainingPages = totalPages % days; // Pages to distribute
  const milestones = [];
  
  let currentPage = 1;
  
  for (let day = 1; day <= days; day++) {
    const startPage = currentPage;
    // Give extra page to first 'remainingPages' days
    const pagesToday = pagesPerDay + (day <= remainingPages ? 1 : 0);
    const endPage = startPage + pagesToday - 1;
    
    const isComplete = isPrivateKhatmahPagesRangeComplete(startPage, endPage);
    
    const startJuz = Math.ceil(startPage / 20);
    const endJuz = Math.min(Math.ceil(endPage / 20), 30); // Cap at Juz 30
    
    milestones.push({
      day,
      title: `Day ${day}`,
      description: `Pages ${startPage}-${endPage} (Juz ${startJuz}${startJuz !== endJuz ? `-${endJuz}` : ''})`,
      pagesRange: `${startPage}-${endPage}`,
      startPage,
      endPage,
      totalPages: endPage - startPage + 1,
      completed: isComplete
    });
    
    currentPage = endPage + 1;
  }
  
  return milestones;
};

// Calculate milestones for public khatmahs
export const calculatePublicKhatmahMilestones = (groupId: string, days: number) => {
  const totalPages = 604;
  const pagesPerDay = Math.ceil(totalPages / days);
  const milestones = [];
  
  for (let day = 1; day <= days; day++) {
    const startPage = (day - 1) * pagesPerDay + 1;
    const endPage = Math.min(day * pagesPerDay, totalPages);
    const isComplete = isPublicKhatmahPagesRangeComplete(groupId, startPage, endPage);
    
    const startJuz = Math.ceil(startPage / 20);
    const endJuz = Math.ceil(endPage / 20);
    
    milestones.push({
      day,
      title: `Day ${day}`,
      description: `Pages ${startPage}-${endPage} (Juz ${startJuz}${startJuz !== endJuz ? `-${endJuz}` : ''})`,
      pagesRange: `${startPage}-${endPage}`,
      startPage,
      endPage,
      totalPages: endPage - startPage + 1,
      completed: isComplete
    });
  }
  
  return milestones;
};

// Migrate old khatmahProgress to new structure (backward compatibility)
export const migrateKhatmahProgressStructure = (): void => {
  const data = getUserData();
  
  // If already migrated, skip
  if (data.publicKhatmahProgress && Object.keys(data.publicKhatmahProgress).length > 0) {
    console.log('✅ Already migrated to new structure');
    return;
  }
  
  // If old khatmahProgress exists, migrate it
  if (data.khatmahProgress && Object.keys(data.khatmahProgress).length > 0) {
    console.log('🔄 Migrating khatmahProgress to new structure...');
    
    // For now, treat all existing khatmahs as public
    // Users will explicitly join private khatmahs through invitations
    data.publicKhatmahProgress = { ...data.khatmahProgress };
    
    console.log(`✅ Migrated ${Object.keys(data.khatmahProgress).length} khatmah(s) to publicKhatmahProgress`);
    
    saveUserData(data);
  }
};

// Restore private khatmah progress from database
export const restorePrivateKhatmahProgressFromDB = (
  progressData: {
    pagesRead: { [key: string]: { completed: boolean; timestamp: string } };
    percentComplete: number;
    lastUpdated: string | null;
  }
): void => {
  const data = getUserData();
  
  // Merge the database progress with local progress
  data.privateKhatmahsUnifiedProgress.pagesRead = {
    ...data.privateKhatmahsUnifiedProgress.pagesRead,
    ...progressData.pagesRead
  };
  
  data.privateKhatmahsUnifiedProgress.lastUpdated = progressData.lastUpdated || new Date().toISOString();
  
  saveUserData(data);
  console.log('✅ Restored private khatmah progress from database');
};