// Cache Debugging Utilities
const OFFLINE_CACHE_NAME = 'quran-offline-v1';

export async function debugCacheContents(): Promise<void> {
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const keys = await cache.keys();
    
    console.log('=== CACHE DEBUG ===');
    console.log(`Total cached items: ${keys.length}`);
    
    for (const request of keys) {
      const response = await cache.match(request);
      console.log(`✅ Cached: ${request.url}`);
      
      if (response) {
        const clone = response.clone();
        const data = await clone.json();
        console.log(`   Data keys:`, Object.keys(data));
      }
    }
    
    console.log('=== END CACHE DEBUG ===');
  } catch (error) {
    console.error('Cache debug error:', error);
  }
}

export async function testCacheLookup(surahNumber: number): Promise<void> {
  try {
    console.log(`\n=== TESTING CACHE FOR SURAH ${surahNumber} ===`);
    
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    
    // Test chapter URL
    const chapterUrl = `https://api.quran.com/api/v4/chapters/${surahNumber}`;
    const chapterResponse = await cache.match(chapterUrl);
    
    if (chapterResponse) {
      console.log(`✅ Chapter ${surahNumber} found in cache`);
      const data = await chapterResponse.clone().json();
      console.log('   Data:', data);
    } else {
      console.log(`❌ Chapter ${surahNumber} NOT found in cache`);
    }
    
    // Test verses URL
    const versesUrl = `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=ar&words=false&translations=131&fields=text_uthmani&per_page=300`;
    const versesResponse = await cache.match(versesUrl);
    
    if (versesResponse) {
      console.log(`✅ Verses for chapter ${surahNumber} found in cache`);
      const data = await versesResponse.clone().json();
      console.log(`   Verses count:`, data.verses?.length || 'unknown');
    } else {
      console.log(`❌ Verses for chapter ${surahNumber} NOT found in cache`);
    }
    
    console.log('=== END TEST ===\n');
  } catch (error) {
    console.error('Test cache lookup error:', error);
  }
}

// Make these available globally for debugging in console
if (typeof window !== 'undefined') {
  (window as any).debugCache = debugCacheContents;
  (window as any).testCache = testCacheLookup;
}
