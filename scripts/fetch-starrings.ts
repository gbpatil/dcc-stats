/**
 * Snapshot the Cricket Leinster "Player Starrings" into `public/starrings.json`.
 *
 * Run during the deploy build (see .github/workflows/deploy.yml) so the browser
 * loads the starrings same-origin instead of through a third-party CORS bridge.
 * Uses the same parser as the app, so the snapshot and a live parse can never
 * disagree.
 *
 *   npm run fetch-starrings
 *
 * Exits non-zero without touching the existing file if anything looks wrong, so
 * a bad run degrades to the previous snapshot rather than publishing nothing.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseStarrings } from '../src/features/starrings/services/starringsParser';

const STARRINGS_PAGE = 'https://www.cricketleinster.ie/clubs/dundalk';
const TIMEOUT_MS = 30_000;
// The club fields three teams; a parse returning fewer entries than this means
// the page markup changed or we got an error/placeholder page, not that the
// club shrank. Refuse to overwrite a good snapshot with that.
const MIN_ENTRIES = 10;

const OUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../public/starrings.json');

async function main(): Promise<void> {
  console.log(`Fetching ${STARRINGS_PAGE} ...`);
  const response = await fetch(STARRINGS_PAGE, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      // Plain `node` as a UA is a common block target; identify as a browser.
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const { month, entries } = parseStarrings(html);

  if (entries.length < MIN_ENTRIES) {
    throw new Error(
      `Parsed only ${entries.length} entries (expected at least ${MIN_ENTRIES}) — ` +
        'refusing to overwrite the existing snapshot.',
    );
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: STARRINGS_PAGE,
    month,
    entries,
  };

  const previous = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : '';
  writeFileSync(OUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);

  const changed =
    previous === '' ||
    JSON.stringify(JSON.parse(previous || '{}').entries) !== JSON.stringify(entries);
  console.log(
    `Wrote ${entries.length} entries for "${month || 'unknown month'}" ` +
      `(${changed ? 'content changed' : 'content unchanged'}) -> public/starrings.json`,
  );
}

main().catch((error: unknown) => {
  console.error(`Starrings snapshot failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
