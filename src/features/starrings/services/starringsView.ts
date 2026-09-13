import type { StarringEntry, StarringsResult, StarringsTeamGroup, StarringsView } from '../types';

// ============================================
// Starrings View - reshapes the raw CL feed into our display format
// ============================================
//
// Cricket Leinster publishes the starrings as a flat run of "Name X.Y" text. We
// present them our way: grouped by team, then by tier, with names normalised for
// display. Keeping this separate from the parser means the scraping rules and
// the presentation rules can change independently.

/**
 * Normalise a name for display. The source list is inconsistently cased — some
 * entries arrive fully lower-case (e.g. "shibuthaman uthaman") — so we title-case
 * each word while preserving the internal capitals of names that are already
 * mixed-case (e.g. "McGrath", "O'Brien"), and keeping hyphenated parts intact.
 */
export function formatPlayerName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) =>
      // Leave any word that already carries an interior capital alone.
      /[A-Z]/.test(word.slice(1))
        ? word
        : word.replace(/(^|['’-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase()),
    )
    .join(' ');
}

/**
 * Group flat starring entries into our display shape: teams ascending, each
 * split into its tiers, names alphabetical within a tier.
 */
export function toStarringsView(result: StarringsResult): StarringsView {
  const byTeam = new Map<number, Map<number, string[]>>();

  for (const entry of result.entries as StarringEntry[]) {
    let tiers = byTeam.get(entry.team);
    if (!tiers) {
      tiers = new Map<number, string[]>();
      byTeam.set(entry.team, tiers);
    }
    const names = tiers.get(entry.tier) ?? [];
    names.push(formatPlayerName(entry.name));
    tiers.set(entry.tier, names);
  }

  const teams: StarringsTeamGroup[] = [...byTeam.entries()]
    .sort(([a], [b]) => a - b)
    .map(([team, tierMap]) => {
      const tiers = [...tierMap.entries()]
        .sort(([a], [b]) => a - b)
        .map(([tier, players]) => ({
          tier,
          code: `${team}.${tier}`,
          players: [...players].sort((a, b) => a.localeCompare(b)),
        }));

      return {
        team,
        label: `Dundalk ${team}`,
        count: tiers.reduce((sum, t) => sum + t.players.length, 0),
        tiers,
      };
    });

  return {
    month: result.month,
    total: teams.reduce((sum, t) => sum + t.count, 0),
    teams,
  };
}
