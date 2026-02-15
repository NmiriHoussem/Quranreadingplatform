// Cache Service - Local caching for improved performance
// Uses localStorage to cache frequently accessed data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

const CACHE_VERSION = 1;
const CACHE_KEYS = {
  PRIVATE_KHATMAHS: 'quran_circle_private_khatmahs_cache',
  INVITATIONS: 'quran_circle_invitations_cache',
} as const;

// Cache expiry time (5 minutes)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Get cached data if available and not expired
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // Check version compatibility
    if (entry.version !== CACHE_VERSION) {
      console.log('🗑️ Cache version mismatch, clearing cache');
      localStorage.removeItem(key);
      return null;
    }

    // Check if cache is still fresh (optional - we use stale-while-revalidate)
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_EXPIRY_MS) {
      console.log('⏰ Cache expired, will fetch fresh data');
      // Don't remove - we'll use it as stale data while revalidating
    }

    console.log('✅ Cache hit:', key, `(age: ${Math.round(age / 1000)}s)`);
    return entry.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Set cached data with timestamp
 */
export function setCachedData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(entry));
    console.log('💾 Cache updated:', key);
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

/**
 * Check if cached data is stale (older than expiry time)
 */
export function isCacheStale(key: string): boolean {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return true;

    const entry: CacheEntry<any> = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;
    return age > CACHE_EXPIRY_MS;
  } catch (error) {
    return true;
  }
}

/**
 * Invalidate (clear) cached data
 */
export function invalidateCache(key: string): void {
  try {
    localStorage.removeItem(key);
    console.log('🗑️ Cache invalidated:', key);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

/**
 * Invalidate all caches
 */
export function invalidateAllCaches(): void {
  Object.values(CACHE_KEYS).forEach(invalidateCache);
}

/**
 * Compare two data objects for equality (deep comparison)
 */
export function areDataEqual<T>(data1: T, data2: T): boolean {
  try {
    return JSON.stringify(data1) === JSON.stringify(data2);
  } catch (error) {
    return false;
  }
}

// Export cache keys for easy access
export { CACHE_KEYS };
