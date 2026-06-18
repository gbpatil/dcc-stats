import { fetchReportData } from '@/features/stats';
import type { StatsRow } from '@/features/stats';
import type { RotationData, RotationPlayer } from '../types';
import { fetchStarrings } from './starringsService';
import nameOverrides from './name_overrides.json';

// ============================================
// Rotation Service - joins starrings with CricketStatz stats and scores players
// ============================================
//
// Underplay is measured by matches played this season (mode=21): fewer matches =
// more underplayed = higher score. This is the only club-wide reliable signal —
// CricketStatz has no complete per-player "days since last appearance" feed
// (mode=240 "Recent Matches" returns only a handful of players, and mode=264
// "Most Days Between Appearances" reports each player's largest historical gap,
// not their recency), so a recency component is intentionally not used.

const MATCHES_PLAYED_URL =
  'https://www2.cricketstatz.com/ss/rrj?mode=21&club=4565&team=0&pool=&season=2025&grade=&newpage=';

/**
 * Build a name-matching key that is robust to ordering and punctuation
 * ("First Last" vs "Last, First") by comparing the set of sorted tokens.
 */
function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,'’-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .sort()
    .join(' ');
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Fetch the season match counts and the current starrings, merge them into a
 * single club-wide list, score each player by how underplayed they are, and
 * sort most-underplayed first.
 */
export async function buildRotationData(season: number): Promise<RotationData> {
  const [starrings, matchesRows] = await Promise.all([
    fetchStarrings(),
    fetchReportData<StatsRow>(MATCHES_PLAYED_URL, season),
  ]);

  const byKey = new Map<string, RotationPlayer>();

  // Seed from the season stats (every player who has played at least one match).
  for (const row of matchesRows) {
    if (typeof row.name !== 'string') continue;
    byKey.set(nameKey(row.name), {
      name: row.name,
      starringCode: null,
      team: null,
      tier: null,
      lastTeam: typeof row.last_team === 'string' ? row.last_team : '',
      matches: Number(row.mts) || 0,
      played: true,
      score: 0,
      needsGames: false,
    });
  }

  // Merge in the starrings: annotate matched players with their designation, and
  // add starred players who have not played at all (0 matches — most underplayed).
  const overrides = nameOverrides as Record<string, string>;
  for (const entry of starrings.entries) {
    const resolvedName = overrides[entry.name] ?? entry.name;
    const key = nameKey(resolvedName);
    const existing = byKey.get(key);
    if (existing) {
      existing.starringCode = entry.code;
      existing.team = entry.team;
      existing.tier = entry.tier;
    } else {
      byKey.set(key, {
        name: entry.name,
        starringCode: entry.code,
        team: entry.team,
        tier: entry.tier,
        lastTeam: `Dundalk ${entry.team}`,
        matches: 0,
        played: false,
        score: 0,
        needsGames: false,
      });
    }
  }

  const players = [...byKey.values()];
  const matchVals = players.map((p) => p.matches);
  const minM = Math.min(...matchVals);
  const maxM = Math.max(...matchVals);
  const med = median(matchVals);

  players.forEach((p) => {
    p.score = maxM === minM ? 0.5 : 1 - (p.matches - minM) / (maxM - minM);
    p.needsGames = p.matches < med;
  });

  // Most underplayed first; ties broken alphabetically for stable display.
  players.sort((a, b) => a.matches - b.matches || a.name.localeCompare(b.name));

  return {
    month: starrings.month,
    season,
    players,
    median: med,
    playedCount: players.filter((p) => p.played).length,
  };
}
