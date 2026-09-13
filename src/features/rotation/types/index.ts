// ============================================
// Rotation Feature - Type Definitions
// ============================================
//
// The Fair Rotation feature ranks ALL Dundalk CC players by how "underplayed"
// they are this season (fewest matches played first), so selectors can see who
// needs game time and should be rotated in. The Cricket Leinster "Player
// Starrings" provide each player's team designation (Team 1/2/3) for context.

// The starrings themselves are owned by the starrings feature; rotation only
// consumes them to annotate players with their designation.
export type { StarringEntry, StarringsResult } from '@/features/starrings';

// A club player enriched with their starring designation and an underplay score.
export interface RotationPlayer {
  name: string;
  starringCode: string | null; // starring code e.g. "2.1", or null if not starred this month
  team: number | null; // starring team (1/2/3), or null
  tier: number | null; // starring tier, or null
  lastTeam: string; // team last played for, from stats (e.g. "Dundalk 2")
  matches: number; // matches played this season (0 if they have not played)
  played: boolean; // whether they appear in the season stats
  score: number; // underplay score, 0..1 (higher = fewer games = more underplayed)
  needsGames: boolean; // flagged as below the club median match count
}

export interface RotationData {
  month: string; // starrings month label
  season: number;
  players: RotationPlayer[]; // all club players, most underplayed first
  median: number; // club median match count
  playedCount: number; // how many players have played at least one match
}
