import type { StarringsResult } from '../types';
import { corsFetch } from '@/lib/corsFetch';
import { parseStarrings } from './starringsParser';

// ============================================
// Starrings Service - loads the Cricket Leinster "Player Starrings"
// ============================================
//
// Cricket Leinster publishes the starrings as server-rendered HTML on the club
// page (no API) and sends no `Access-Control-Allow-Origin` header, so a browser
// can never read that page directly. Every runtime workaround we have tried has
// eventually failed: corsproxy.io carried this page in production until it
// dropped anonymous access (403), and its replacements are no better —
// api.codetabs.com currently 522s on *every* target, and api.allorigins.win
// works generally but times out (~20s) specifically on cricketleinster.ie,
// returning a CORS-header-less error page the browser reports as an opaque CORS
// failure.
//
// So we stopped fetching this page from the browser at all. The starrings change
// once a month; `scripts/fetch-starrings.ts` snapshots and parses them during
// the deploy build and ships the result as `starrings.json` next to the app.
// Loading it is a plain same-origin request, which no third party can break and
// CORS never applies to. The live-fetch chain below survives only as a fallback
// for when the snapshot is missing.
//
// This ordering also means dev and production finally exercise the same primary
// path. Previously dev went through the Vite `/cl` proxy and production went
// through a public bridge, so local testing could not surface a broken bridge.

const STARRINGS_PAGE = 'https://www.cricketleinster.ie/clubs/dundalk';

/** The build-time snapshot, served from our own origin (so: no CORS, ever). */
const SNAPSHOT_URL = `${import.meta.env.BASE_URL}starrings.json`;

interface StarringsSnapshot {
  generatedAt?: string;
  month?: string;
  entries?: unknown;
}

/**
 * Load the snapshot shipped with the build. Returns null (rather than throwing)
 * whenever it is absent or unusable, so the caller can fall through to a live
 * fetch — a stale deploy should degrade, not break the page.
 */
async function fetchSnapshot(): Promise<StarringsResult | null> {
  try {
    const response = await fetch(SNAPSHOT_URL);
    if (!response.ok) return null;
    const snapshot: StarringsSnapshot = await response.json();
    // A missing file can come back as the host's 404 page with a 200, so check
    // the shape rather than trusting the status.
    if (!Array.isArray(snapshot.entries) || snapshot.entries.length === 0) return null;
    return {
      month: typeof snapshot.month === 'string' ? snapshot.month : '',
      entries: snapshot.entries as StarringsResult['entries'],
      generatedAt: snapshot.generatedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Our own proxy for the club page, if Supabase is configured for this build.
 * Returns an empty list when it is not, leaving only the public bridges.
 */
function preferredProxies(): Array<(url: string) => string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return [];
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/cl-starrings`;
  // The endpoint ignores its input entirely (the target is hardcoded server
  // side), so the target URL is discarded here rather than passed along.
  return [() => endpoint];
}

/**
 * Fetch the club page HTML live: via the Vite proxy in dev, or in production via
 * our Edge Function with the public bridges behind it. Only reached when the
 * build-time snapshot is unavailable.
 */
async function fetchStarringsHtml(): Promise<string> {
  if (import.meta.env.DEV) {
    const response = await fetch('/cl/clubs/dundalk');
    if (!response.ok) {
      throw new Error(`Failed to fetch Player Starrings: ${response.statusText}`);
    }
    return response.text();
  }

  // skipDirect: this origin is known to send no CORS headers, so a direct
  // request would always be blocked — go straight to the proxies.
  const response = await corsFetch(STARRINGS_PAGE, {
    skipDirect: true,
    preferredProxies: preferredProxies(),
  });
  return response.text();
}

/**
 * Load the current Player Starrings: the build-time snapshot when present,
 * otherwise a live fetch and parse of the club page.
 */
export async function fetchStarrings(): Promise<StarringsResult> {
  const snapshot = await fetchSnapshot();
  if (snapshot) return snapshot;

  const html = await fetchStarringsHtml();
  return parseStarrings(html);
}

export { parseStarrings };
