import type { RotationData } from '../types';

// ============================================
// Rotation Cache - TTL cache for computed rotation data
// ============================================
//
// Rotation data changes rarely (starrings monthly, match stats occasionally), so
// we cache it per season to avoid refetching every time the tab is reopened.
// Backed by localStorage so the cache survives navigation and page reloads, with
// an in-memory layer for instant reads. A manual refresh bypasses the cache.

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const STORAGE_PREFIX = 'dcc-rotation-cache-';

export interface RotationCacheEntry {
  data: RotationData;
  timestamp: number; // ms epoch when fetched
}

const memory = new Map<number, RotationCacheEntry>();

function storageKey(season: number): string {
  return `${STORAGE_PREFIX}${season}`;
}

/**
 * Return the cached entry for a season if it exists and is still within the TTL,
 * otherwise null. Hydrates the in-memory layer from localStorage on first hit.
 */
export function getCachedRotation(season: number): RotationCacheEntry | null {
  const now = Date.now();

  const mem = memory.get(season);
  if (mem && now - mem.timestamp < CACHE_TTL_MS) return mem;

  try {
    const raw = localStorage.getItem(storageKey(season));
    if (raw) {
      const entry = JSON.parse(raw) as RotationCacheEntry;
      if (entry?.timestamp && now - entry.timestamp < CACHE_TTL_MS) {
        memory.set(season, entry);
        return entry;
      }
    }
  } catch {
    // Ignore malformed/unavailable storage — treat as a cache miss.
  }
  return null;
}

/**
 * Store fresh rotation data for a season in both the in-memory and localStorage
 * caches, returning the stored entry (with its timestamp).
 */
export function setCachedRotation(season: number, data: RotationData): RotationCacheEntry {
  const entry: RotationCacheEntry = { data, timestamp: Date.now() };
  memory.set(season, entry);
  try {
    localStorage.setItem(storageKey(season), JSON.stringify(entry));
  } catch {
    // Ignore storage quota/availability errors — in-memory cache still applies.
  }
  return entry;
}
