/**
 * GlyphGenesis Frontend Cache
 * localStorage-based cache with TTL, optimistic updates, and retry logic
 */

const DEFAULT_TTL = 60000; // 1 minute
const MAX_ENTRIES = 200;

class GlyphCache {
  constructor(prefix = 'glyph_') {
    this.prefix = prefix;
    this.memoryCache = new Map();
  }

  _key(key) {
    return `${this.prefix}${key}`;
  }

  /** Get cached value if not expired */
  get(key) {
    // Check memory cache first (fastest)
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      if (Date.now() < entry.expiry) return entry.value;
      this.memoryCache.delete(key);
    }

    // Check localStorage
    try {
      const raw = localStorage.getItem(this._key(key));
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() < entry.expiry) {
        // Promote to memory cache
        this.memoryCache.set(key, entry);
        return entry.value;
      }
      // Expired — remove
      localStorage.removeItem(this._key(key));
      return null;
    } catch {
      return null;
    }
  }

  /** Set cache value with TTL */
  set(key, value, ttl = DEFAULT_TTL) {
    const entry = { value, expiry: Date.now() + ttl, updated: Date.now() };
    this.memoryCache.set(key, entry);
    try {
      localStorage.setItem(this._key(key), JSON.stringify(entry));
      this._evictIfNeeded();
    } catch {
      // localStorage full — clear old entries
      this._evictIfNeeded();
      try {
        localStorage.setItem(this._key(key), JSON.stringify(entry));
      } catch {
        // Give up silently
      }
    }
  }

  /** Optimistic update: set immediately, then verify with fetch */
  async optimistic(key, newValue, verifyFn, ttl = DEFAULT_TTL) {
    this.set(key, newValue, ttl);
    try {
      const verified = await verifyFn();
      this.set(key, verified, ttl);
      return verified;
    } catch {
      // Revert on failure
      this.invalidate(key);
      throw new Error('Optimistic update verification failed');
    }
  }

  /** Fetch with cache: return cache if fresh, otherwise fetch and cache */
  async fetch(key, fetchFn, ttl = DEFAULT_TTL) {
    const cached = this.get(key);
    if (cached !== null) return cached;

    try {
      const value = await fetchFn();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      // Return stale cache if available (better than error)
      const stale = this._getStale(key);
      if (stale !== null) return stale;
      throw error;
    }
  }

  /** Fetch with retry and exponential backoff */
  async fetchWithRetry(key, fetchFn, ttl = DEFAULT_TTL, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetch(key, fetchFn, ttl);
      } catch (error) {
        if (attempt === maxRetries) throw error;
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  /** Get stale (expired) cache as fallback */
  _getStale(key) {
    try {
      const raw = localStorage.getItem(this._key(key));
      if (!raw) return null;
      const entry = JSON.parse(raw);
      // Return even if expired (up to 10 minutes stale)
      if (Date.now() < entry.expiry + 600000) return entry.value;
      return null;
    } catch {
      return null;
    }
  }

  /** Invalidate a specific key */
  invalidate(key) {
    this.memoryCache.delete(key);
    try { localStorage.removeItem(this._key(key)); } catch {}
  }

  /** Invalidate all keys with this prefix */
  invalidateAll() {
    this.memoryCache.clear();
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  /** Evict oldest entries if localStorage is getting full */
  _evictIfNeeded() {
    try {
      const entries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const entry = JSON.parse(raw);
              entries.push({ key: k, updated: entry.updated || 0 });
            } catch {}
          }
        }
      }
      if (entries.length > MAX_ENTRIES) {
        entries.sort((a, b) => a.updated - b.updated);
        const toRemove = entries.slice(0, entries.length - MAX_ENTRIES);
        toRemove.forEach(e => localStorage.removeItem(e.key));
      }
    } catch {}
  }

  /** Get cache stats for debugging */
  stats() {
    let count = 0;
    let expired = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          count++;
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const entry = JSON.parse(raw);
              if (Date.now() >= entry.expiry) expired++;
            } catch {}
          }
        }
      }
    } catch {}
    return { count, expired, memoryEntries: this.memoryCache.size };
  }
}

// Singleton instances for different data types
export const artworkCache = new GlyphCache('glyph_art_');
export const statsCache = new GlyphCache('glyph_stats_');
export const profileCache = new GlyphCache('glyph_prof_');

export { GlyphCache };
export default GlyphCache;
