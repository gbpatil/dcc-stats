import type { StarringEntry, StarringsResult } from '../types';

// ============================================
// Starrings Service - fetches & parses the Cricket Leinster "Player Starrings"
// ============================================
//
// The starrings are published monthly as server-rendered HTML on the club page
// (no API). Each player is listed with a "X.Y" code where the first digit is the
// team number and the second is the rank within that team. We fetch the page and
// extract those codes. As with reportService, dev uses a Vite proxy and
// production uses corsproxy.io to bypass CORS.

const STARRINGS_PAGE = 'https://www.cricketleinster.ie/clubs/dundalk';

/**
 * Fetch the club page HTML, going through the dev proxy or the prod CORS bridge.
 */
async function fetchStarringsHtml(): Promise<string> {
  const finalUrl = import.meta.env.DEV
    ? '/cl/clubs/dundalk'
    : `https://corsproxy.io/?${encodeURIComponent(STARRINGS_PAGE)}`;

  const response = await fetch(finalUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Player Starrings: ${response.statusText}`);
  }
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
