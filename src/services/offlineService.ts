// Offline Download Service
import { getVersesByChapter, getChapter, Chapter } from './quranApi';

export interface DownloadProgress {
  surahNumber: number;
  surahName: string;
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

export interface OfflineStorageInfo {
  totalSurahs: number;
  downloadedSurahs: number;
  estimatedSize: string;
  lastUpdated: string | null;
}

const OFFLINE_CACHE_NAME = 'quran-offline-v1';
const OFFLINE_STORAGE_KEY = 'quran-offline-surahs';

// Get list of downloaded surahs from localStorage
export function getDownloadedSurahs(): number[] {
  try {
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading downloaded surahs:', error);
    return [];
  }
}

// Save list of downloaded surahs to localStorage
function saveDownloadedSurahs(surahNumbers: number[]): void {
  try {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(surahNumbers));
    localStorage.setItem('quran-offline-last-updated', new Date().toISOString());
  } catch (error) {
    console.error('Error saving downloaded surahs:', error);
  }
}

// Check if a surah is downloaded
export function isSurahDownloaded(surahNumber: number): boolean {
  const downloaded = getDownloadedSurahs();
  return downloaded.includes(surahNumber);
}

// Download a single surah and cache it
export async function downloadSurah(
  surahNumber: number,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    onProgress?.(10);
    
    // Fetch chapter info
    const chapterInfo = await getChapter(surahNumber);
    onProgress?.(30);
    
    // Fetch verses with translation
    const chapterData = await getVersesByChapter(surahNumber);
    onProgress?.(70);
    
    // Open cache and store the data
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    
    // Cache the chapter info
    const chapterUrl = `https://api.quran.com/api/v4/chapters/${surahNumber}`;
    const chapterResponse = new Response(JSON.stringify({ chapter: chapterInfo }), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(chapterUrl, chapterResponse);
    
    // Cache the verses
    const versesUrl = `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=ar&words=false&translations=131&fields=text_uthmani&per_page=300`;
    const versesResponse = new Response(JSON.stringify(chapterData), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(versesUrl, versesResponse);
    
    onProgress?.(90);
    
    // Mark as downloaded
    const downloaded = getDownloadedSurahs();
    if (!downloaded.includes(surahNumber)) {
      downloaded.push(surahNumber);
      saveDownloadedSurahs(downloaded.sort((a, b) => a - b));
    }
    
    onProgress?.(100);
  } catch (error) {
    console.error(`Error downloading surah ${surahNumber}:`, error);
    throw error;
  }
}

// Download multiple surahs with progress tracking
export async function downloadMultipleSurahs(
  surahNumbers: number[],
  onProgress?: (progress: DownloadProgress[]) => void
): Promise<void> {
  const progressMap = new Map<number, DownloadProgress>();
  
  // Initialize progress for all surahs
  for (const num of surahNumbers) {
    progressMap.set(num, {
      surahNumber: num,
      surahName: `Surah ${num}`,
      progress: 0,
      status: 'pending'
    });
  }
  
  // Download surahs one by one (to avoid overwhelming the API)
  for (const surahNumber of surahNumbers) {
    try {
      // Update status to downloading
      const current = progressMap.get(surahNumber)!;
      current.status = 'downloading';
      onProgress?.(Array.from(progressMap.values()));
      
      // Download with progress
      await downloadSurah(surahNumber, (progress) => {
        current.progress = progress;
        onProgress?.(Array.from(progressMap.values()));
      });
      
      // Mark as completed
      current.status = 'completed';
      current.progress = 100;
      onProgress?.(Array.from(progressMap.values()));
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      const current = progressMap.get(surahNumber)!;
      current.status = 'error';
      current.error = error instanceof Error ? error.message : 'Download failed';
      onProgress?.(Array.from(progressMap.values()));
    }
  }
}

// Delete a downloaded surah
export async function deleteSurah(surahNumber: number): Promise<void> {
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    
    // Delete chapter info
    const chapterUrl = `https://api.quran.com/api/v4/chapters/${surahNumber}`;
    await cache.delete(chapterUrl);
    
    // Delete verses
    const versesUrl = `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=ar&words=false&translations=131&fields=text_uthmani&per_page=300`;
    await cache.delete(versesUrl);
    
    // Remove from downloaded list
    const downloaded = getDownloadedSurahs();
    const filtered = downloaded.filter(num => num !== surahNumber);
    saveDownloadedSurahs(filtered);
  } catch (error) {
    console.error(`Error deleting surah ${surahNumber}:`, error);
    throw error;
  }
}

// Delete all downloaded surahs
export async function deleteAllSurahs(): Promise<void> {
  try {
    await caches.delete(OFFLINE_CACHE_NAME);
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    localStorage.removeItem('quran-offline-last-updated');
  } catch (error) {
    console.error('Error deleting all surahs:', error);
    throw error;
  }
}

// Get storage information
export async function getOfflineStorageInfo(): Promise<OfflineStorageInfo> {
  const downloaded = getDownloadedSurahs();
  const lastUpdated = localStorage.getItem('quran-offline-last-updated');
  
  // Estimate size (rough calculation)
  // Average surah: ~50KB (text + translation)
  const estimatedSizeKB = downloaded.length * 50;
  const estimatedSize = estimatedSizeKB < 1024 
    ? `${estimatedSizeKB} KB` 
    : `${(estimatedSizeKB / 1024).toFixed(1)} MB`;
  
  return {
    totalSurahs: 114,
    downloadedSurahs: downloaded.length,
    estimatedSize,
    lastUpdated
  };
}

// Get popular surahs for quick download
export function getPopularSurahs(): number[] {
  return [
    1,   // Al-Fatiha
    2,   // Al-Baqarah
    18,  // Al-Kahf
    36,  // Yasin
    55,  // Ar-Rahman
    56,  // Al-Waqi'ah
    67,  // Al-Mulk
    73,  // Al-Muzzammil
    78,  // An-Naba
    112, // Al-Ikhlas
    113, // Al-Falaq
    114  // An-Nas
  ];
}

// Get Juz' (parts) for download
export function getJuzSurahs(juzNumber: number): number[] {
  // Simplified mapping of Juz to Surahs (main surahs in each juz)
  const juzMap: Record<number, number[]> = {
    1: [1, 2], // Al-Fatiha, Al-Baqarah (1-21)
    2: [2], // Al-Baqarah (22-141)
    3: [2, 3], // Al-Baqarah (142-252), Ali Imran (1-14)
    4: [3, 4], // Ali Imran (15-92), An-Nisa (1-23)
    5: [4], // An-Nisa (24-147)
    6: [4, 5], // An-Nisa (148-176), Al-Ma'idah (1-81)
    7: [5, 6], // Al-Ma'idah (82-120), Al-An'am (1-110)
    8: [6, 7], // Al-An'am (111-165), Al-A'raf (1-87)
    9: [7, 8], // Al-A'raf (88-206), Al-Anfal
    10: [8, 9], // Al-Anfal, At-Tawbah (1-92)
    11: [9, 10, 11], // At-Tawbah (93-129), Yunus, Hud (1-5)
    12: [11, 12], // Hud (6-123), Yusuf (1-52)
    13: [12, 13, 14], // Yusuf (53-111), Ar-Ra'd, Ibrahim
    14: [15, 16], // Al-Hijr, An-Nahl (1-128)
    15: [17, 18], // Al-Isra, Al-Kahf (1-74)
    16: [18, 19, 20], // Al-Kahf (75-110), Maryam, Ta-Ha (1-135)
    17: [21, 22], // Al-Anbiya, Al-Hajj
    18: [23, 24, 25], // Al-Mu'minun, An-Nur, Al-Furqan
    19: [25, 26, 27], // Al-Furqan (21-77), Ash-Shu'ara, An-Naml (1-55)
    20: [27, 28, 29], // An-Naml (56-93), Al-Qasas, Al-Ankabut (1-45)
    21: [29, 30, 31, 32, 33], // Al-Ankabut (46-69), Ar-Rum, Luqman, As-Sajdah, Al-Ahzab (1-30)
    22: [33, 34, 35, 36], // Al-Ahzab (31-73), Saba, Fatir, Ya-Sin
    23: [36, 37, 38, 39], // Ya-Sin (28-83), As-Saffat, Sad, Az-Zumar (1-31)
    24: [39, 40, 41], // Az-Zumar (32-75), Ghafir, Fussilat
    25: [41, 42, 43, 44, 45], // Fussilat (47-54), Ash-Shura, Az-Zukhruf, Ad-Dukhan, Al-Jathiyah
    26: [46, 47, 48, 49, 50, 51], // Al-Ahqaf, Muhammad, Al-Fath, Al-Hujurat, Qaf, Adh-Dhariyat (1-30)
    27: [51, 52, 53, 54, 55, 56, 57], // Adh-Dhariyat (31-60), At-Tur, An-Najm, Al-Qamar, Ar-Rahman, Al-Waqi'ah, Al-Hadid
    28: [58, 59, 60, 61, 62, 63, 64, 65, 66], // Al-Mujadila, Al-Hashr, Al-Mumtahanah, As-Saff, Al-Jumu'ah, Al-Munafiqun, At-Taghabun, At-Talaq, At-Tahrim
    29: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77], // Al-Mulk through Al-Mursalat
    30: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114] // An-Naba through An-Nas
  };
  
  return juzMap[juzNumber] || [];
}
