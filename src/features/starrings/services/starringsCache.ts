import type { StarringsResult } from '../types';

// ============================================
// Starrings Cache - TTL cache with a stale fallback
// ============================================
//
// The starrings update once a month, so a long TTL is fine. More importantly,
// this is a public view whose data comes through a third-party CORS bridge that
// is known to fail intermittently (Cloudflare 520/522). Rather than show every
// visitor an error when a bridge has a bad minute, we keep the last good result
// and fall back to it — `getStaleStarrings` ignores the TTL for exactly that.

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const STORAGE_KEY = 'dcc-starrings-cache';

export interface StarringsCacheEntry {
  data: StarringsResult;
  timestamp: number; // ms epoch when fetched
}

let memory: StarringsCacheEntry | null = null;

/** Read the stored entry regardless of age, hydrating the in-memory layer. */
function readEntry(): StarringsCacheEntry | null {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as StarringsCacheEntry;
    if (!entry?.timestamp || !entry?.data) return null;
    memory = entry;
    return entry;
  } catch {
    // Ignore malformed/unavailable storage — treat as a cache miss.
    return null;
  }
}

/** The cached starrings if still within the TTL, otherwise null. */
export function getCachedStarrings(): StarringsCacheEntry | null {
  const entry = readEntry();
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) return entry;
  return null;
}

/**
 * The last cached starrings at any age, or null if nothing was ever stored.
 * Used to keep the page useful when a refresh fails.
 */
export function getStaleStarrings(): StarringsCacheEntry | null {
  return readEntry();
}

/** Store a fresh result in both the in-memory and localStorage caches. */
export function setCachedStarrings(data: StarringsResult): StarringsCacheEntry {
  const entry: StarringsCacheEntry = { data, timestamp: Date.now() };
  memory = entry;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage quota/availability errors — in-memory cache still applies.
  }
  return entry;
}
