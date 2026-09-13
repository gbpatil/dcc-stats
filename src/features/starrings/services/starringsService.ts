import type { StarringEntry, StarringsResult } from '../types';
import { corsFetch } from '@/lib/corsFetch';

// ============================================
// Starrings Service - fetches & parses the Cricket Leinster "Player Starrings"
// ============================================
//
// The starrings are published monthly as server-rendered HTML on the club page
// (no API). Each player is listed with a "X.Y" code where the first digit is the
// team number and the second is the tier within that team. We fetch the page and
// extract those codes.
//
// This page sends no `Access-Control-Allow-Origin` header, so the browser can
// never read it directly. Dev uses the Vite `/cl` proxy. Production prefers our
// own `cl-starrings` Supabase Edge Function, because the public CORS bridges
// proved unreliable for this origin (codetabs 522s consistently; allorigins
// succeeds about one attempt in three and takes ~20s to fail, returning a
// CORS-header-less error page that the browser reports as an opaque CORS
// failure). The bridges stay as a fallback for when Supabase is unconfigured.

const STARRINGS_PAGE = 'https://www.cricketleinster.ie/clubs/dundalk';

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
 * Fetch the club page HTML via the dev proxy, or in production via our Edge
 * Function with the public bridges as a fallback.
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
 * Extract the month label (e.g. "June 2026") from a "Player Starrings : June 2026"
 * heading, if present.
 */
function extractMonth(text: string): string {
  const match = text.match(/Player Starrings\s*:?\s*([A-Z][a-z]+\s+\d{4})/);
  return match ? match[1] : '';
}

/**
 * Parse starring entries out of the page text. The data renders as plain text
 * like "Dundalk 2 Player Name 2.1"; we scope parsing to the region between the
 * "Player Starrings :" heading and the following "About" section, then pull out
 * every "Name X.Y" pattern, deriving the team from X and the tier from Y.
 * Defensive by design — the source markup can change, so we dedupe by name and
 * accept only teams 1–3. Names may be lower- or upper-case; the digits in the
 * "Dundalk N" group headers naturally prevent those headers being captured as
 * part of a player name (the name character class excludes digits).
 */
export function parseStarrings(html: string): StarringsResult {
  // Strip tags into a whitespace-normalised text stream. Insert spaces for tag
  // boundaries so adjacent list items don't run together.
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  const month = extractMonth(text);

  // Anchor to the "Player Starrings :" data heading (skips the page-nav link of
  // the same name) and bound the end at the "About" section that follows the
  // team lists, so stray "X.Y" numbers elsewhere on the page can't match.
  let start = text.search(/Player Starrings\s*:/i);
  if (start < 0) start = text.search(/Player Starrings/i);
  let region = start >= 0 ? text.slice(start) : text;
  const aboutIdx = region.search(/\bAbout\b/);
  if (aboutIdx > 0) region = region.slice(0, aboutIdx);

  // Name tokens (letters/spaces/apostrophes/dots/hyphens, no digits) followed by
  // a "X.Y" code. Lazy name match anchors each entry to its trailing code.
  const entryRe = /([A-Za-z][A-Za-z'’.\- ]*?)\s+([1-3])\.(\d+)\b/g;

  const seen = new Set<string>();
  const entries: StarringEntry[] = [];
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(region)) !== null) {
    const name = m[1].trim();
    const team = Number(m[2]);
    const tier = Number(m[3]);
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ name, team, tier, code: `${team}.${tier}` });
  }

  return { month, entries };
}

/**
 * Fetch and parse the current Player Starrings.
 */
export async function fetchStarrings(): Promise<StarringsResult> {
  const html = await fetchStarringsHtml();
  return parseStarrings(html);
}
