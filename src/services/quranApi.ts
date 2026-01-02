// Quran.com API Service
const BASE_URL = 'https://api.quran.com/api/v4';
const OFFLINE_CACHE_NAME = 'quran-offline-v1';

// Helper function to fetch with cache-first strategy
async function fetchWithCache(url: string): Promise<Response> {
  try {
    // Try to get from cache first
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    
    // Try exact match first
    let cachedResponse = await cache.match(url);
    
    // If no exact match, try ignoring query string differences
    if (!cachedResponse) {
      cachedResponse = await cache.match(url, { ignoreSearch: false });
    }
    
    if (cachedResponse) {
      console.log('✅ Serving from cache:', url);
      return cachedResponse;
    }
    
    // Check if we're online before trying network
    if (!navigator.onLine) {
      console.warn('📵 Offline and no cache found for:', url);
      
      // Debug: List what's actually in the cache
      console.log('🔍 Checking what URLs are in cache...');
      const requests = await cache.keys();
      console.log(`📦 Cache has ${requests.length} entries:`);
      requests.forEach((req, idx) => {
        if (idx < 10) { // Only show first 10 to avoid spam
          console.log(`  ${idx + 1}. ${req.url}`);
        }
      });
      if (requests.length > 10) {
        console.log(`  ... and ${requests.length - 10} more`);
      }
      
      // Try checking all caches one more time
      const cacheNames = await caches.keys();
      console.log('🔍 Available caches:', cacheNames);
      for (const cacheName of cacheNames) {
        const otherCache = await caches.open(cacheName);
        const otherResponse = await otherCache.match(url);
        if (otherResponse) {
          console.log(`✅ Found in cache (${cacheName}):`, url);
          return otherResponse;
        }
      }
      
      throw new Error(`Offline and no cached version available for ${url}`);
    }
    
    // If not in cache, fetch from network
    console.log('📡 Fetching from network:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Clone the response to cache it
    const responseToCache = response.clone();
    cache.put(url, responseToCache);
    
    return response;
  } catch (error) {
    console.warn('❌ Network fetch failed:', error);
    
    // If network fails, try cache one more time (in case it was added during download)
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const cachedResponse = await cache.match(url);
    
    if (cachedResponse) {
      console.log('✅ Serving from cache after network error:', url);
      return cachedResponse;
    }
    
    // Check workbox caches as well
    const cacheNames = await caches.keys();
    console.log('🔍 Searching all caches:', cacheNames);
    for (const cacheName of cacheNames) {
      const workboxCache = await caches.open(cacheName);
      const workboxResponse = await workboxCache.match(url);
      if (workboxResponse) {
        console.log(`✅ Serving from workbox cache (${cacheName}):`, url);
        return workboxResponse;
      }
    }
    
    console.error('❌ Not found in any cache:', url);
    throw new Error(`Failed to fetch ${url} and no cached version available`);
  }
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani?: string;
  text_imlaei?: string;
  translations?: Array<{
    id: number;
    text: string;
    resource_name: string;
  }>;
  // Quran.com API v4 uses 'words' field for text
  words?: Array<{
    text: string;
    text_uthmani: string;
  }>;
}

export interface Chapter {
  id: number;
  chapter_number: number;
  name_simple: string;
  name_arabic: string;
  name_complex: string;
  revelation_place: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    name: string;
    language_name: string;
  };
}

export interface PageData {
  verses: Verse[];
  pagination: {
    current_page: number;
    total_pages: number;
  };
}

export interface ChapterData {
  chapter: Chapter;
  verses: Verse[];
}

// Get all chapters
export async function getChapters(): Promise<Chapter[]> {
  try {
    const url = `${BASE_URL}/chapters`;
    const response = await fetchWithCache(url);
    const data = await response.json();
    console.log('Raw chapters from API:', data.chapters.slice(0, 2)); // Log first 2 for debugging
    // Ensure chapter_number is set (map id to chapter_number if needed)
    return data.chapters.map((ch: any) => ({
      ...ch,
      chapter_number: ch.chapter_number || ch.id
    }));
  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw error;
  }
}

// Get verses by page number (for Reading mode - Mushaf pagination)
export async function getVersesByPage(pageNumber: number, translationId: number = 131): Promise<PageData> {
  try {
    const url = `${BASE_URL}/verses/by_page/${pageNumber}?language=ar&words=false&translations=${translationId}&fields=text_uthmani&per_page=50`;
    const response = await fetchWithCache(url);
    const data = await response.json();
    
    return {
      verses: data.verses,
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Error fetching verses by page:', error);
    throw error;
  }
}

// Get verses by chapter (for Memorization mode)
export async function getVersesByChapter(chapterNumber: number, translationId: number = 131): Promise<ChapterData> {
  try {
    console.log('Fetching chapter:', chapterNumber);
    
    // Get chapter info (check cache first)
    const chapterUrl = `${BASE_URL}/chapters/${chapterNumber}`;
    const chapterResponse = await fetchWithCache(chapterUrl);
    const chapterData = await chapterResponse.json();
    
    // Get verses with translation and Uthmani text (check cache first)
    const versesUrl = `${BASE_URL}/verses/by_chapter/${chapterNumber}?language=ar&words=false&translations=${translationId}&fields=text_uthmani&per_page=300`;
    console.log('Fetching verses from:', versesUrl);
    
    const versesResponse = await fetchWithCache(versesUrl);
    const versesData = await versesResponse.json();
    
    return {
      chapter: chapterData.chapter,
      verses: versesData.verses
    };
  } catch (error) {
    console.error('Error fetching verses by chapter:', error);
    throw error;
  }
}

// Get chapter info
export async function getChapter(chapterNumber: number): Promise<Chapter> {
  try {
    const url = `${BASE_URL}/chapters/${chapterNumber}`;
    const response = await fetchWithCache(url);
    const data = await response.json();
    return data.chapter;
  } catch (error) {
    console.error('Error fetching chapter:', error);
    throw error;
  }
}

// Translation IDs (commonly used):
// 131 - Dr. Mustafa Khattab, the Clear Quran (English)
// 20 - Sahih International (English)
// 85 - Mufti Taqi Usmani (English)
// 203 - Abdel Haleem (English)

// Reciter interface
export interface Reciter {
  id: number;
  name: string;
  arabic_name: string;
  relative_path: string;
}

// Popular reciters with their Quran.com API identifiers
export const RECITERS: Reciter[] = [
  { id: 7, name: 'Mishari Rashid al-Afasy', arabic_name: 'مشاري بن راشد العفاسي', relative_path: 'Alafasy_64kbps' },
  { id: 1, name: 'AbdulBaset AbdulSamad', arabic_name: 'عبد الباسط عبد الصمد', relative_path: 'Abdul_Basit_Murattal_64kbps' },
  { id: 2, name: 'Abdur-Rahman as-Sudais', arabic_name: 'عبد الرحمن السديس', relative_path: 'Abdurrahmaan_As-Sudais_64kbps' },
  { id: 3, name: 'Abu Bakr al-Shatri', arabic_name: 'أبو بكر الشاطري', relative_path: 'Abu_Bakr_Ash-Shaatree_64kbps' },
  { id: 5, name: 'Mahmoud Khalil Al-Hussary', arabic_name: 'محمود خليل الحصري', relative_path: 'Husary_64kbps' },
  { id: 6, name: 'Saad Al-Ghamadi', arabic_name: 'سعد الغامدي', relative_path: 'Ghamadi_40kbps' },
  { id: 8, name: 'Muhammad Siddiq al-Minshawi', arabic_name: 'محمد صديق المنشاوي', relative_path: 'Minshawy_Murattal_128kbps' },
];

// Get audio URL for a specific verse using EveryAyah.com mirror (HTTPS)
export function getVerseAudioUrl(verseKey: string, reciterId: number): string {
  const reciter = RECITERS.find(r => r.id === reciterId);
  if (!reciter) return '';
  
  // Using versebyversequran.com as an HTTPS mirror of EveryAyah
  // Format: https://www.versebyversequran.com/data/{reciter_folder}/{chapter:padded}{verse:padded}.mp3
  const [chapter, verse] = verseKey.split(':');
  const paddedChapter = chapter.padStart(3, '0');
  const paddedVerse = verse.padStart(3, '0');
  
  const url = `https://www.versebyversequran.com/data/${reciter.relative_path}/${paddedChapter}${paddedVerse}.mp3`;
  console.log(`Generated audio URL for ${verseKey}:`, url);
  return url;
}

// Get Mushaf page image URL
// Using publicly accessible Mushaf page images from salahamassi/Quran-svg-mobile (optimized for mobile with better centering)
// and QuranHub (PNG with tajweed colors)
export function getMushafPageImageUrl(pageNumber: number, useTajweed: boolean = false): string {
  if (pageNumber < 1 || pageNumber > 604) {
    console.error(`Invalid page number: ${pageNumber}`);
    return '';
  }
  
  if (useTajweed) {
    // Using images from QuranHub GitHub repository with tajweed color coding
    // https://github.com/QuranHub/quran-pages-images
    // Format: https://raw.githubusercontent.com/QuranHub/quran-pages-images/main/ayat/tajweed/{pageNumber}.png
    const url = `https://raw.githubusercontent.com/QuranHub/quran-pages-images/main/ayat/tajweed/${pageNumber}.png`;
    console.log(`Generated Mushaf page image URL for page ${pageNumber} (tajweed):`, url);
    return url;
  } else {
    // Using SVG images from salahamassi/Quran-svg-mobile repository (optimized for mobile, better centered)
    // https://github.com/salahamassi/Quran-svg-mobile
    // Format: https://raw.githubusercontent.com/salahamassi/Quran-svg-mobile/main/output/{pageNumber}.svg
    // Page numbers are zero-padded to 3 digits (001-604)
    const paddedPageNumber = String(pageNumber).padStart(3, '0');
    const url = `https://raw.githubusercontent.com/salahamassi/Quran-svg-mobile/main/output/${paddedPageNumber}.svg`;
    console.log(`Generated Mushaf page image URL for page ${pageNumber} (mobile-optimized SVG):`, url);
    return url;
  }
}