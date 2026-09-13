// ============================================
// Starrings Feature - Type Definitions
// ============================================
//
// Cricket Leinster publishes a monthly "Player Starrings" list: every club
// player is given a "X.Y" code where X is the team they are designated to and Y
// is their tier within that team. Note that Y is a *tier*, not a unique rank —
// many players share the same code (e.g. eight players at "1.1").

/** A single entry parsed from the Cricket Leinster "Player Starrings" section. */
export interface StarringEntry {
  name: string;
  team: number; // 1, 2 or 3
  tier: number; // the ".Y" tier within the team
  code: string; // e.g. "2.1"
}

export interface StarringsResult {
  month: string; // e.g. "September 2026" (display label), or '' if not found
  entries: StarringEntry[];
}

/** One tier within a team, holding every player sharing that code. */
export interface StarringsTier {
  tier: number;
  code: string; // e.g. "1.2"
  players: string[]; // display-formatted names, alphabetical
}

/** All players designated to one team, grouped into their tiers. */
export interface StarringsTeamGroup {
  team: number;
  label: string; // e.g. "Dundalk 1"
  count: number; // total players across all tiers
  tiers: StarringsTier[]; // ascending by tier
}

/** The starrings shaped for display: teams ascending, each grouped by tier. */
export interface StarringsView {
  month: string;
  total: number;
  teams: StarringsTeamGroup[];
}
