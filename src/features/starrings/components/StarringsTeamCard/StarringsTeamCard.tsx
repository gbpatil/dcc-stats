import type { StarringsTeamGroup } from '../../types';
import styles from './StarringsTeamCard.module.css';

interface StarringsTeamCardProps {
  group: StarringsTeamGroup;
}

/** Accent colour per team, so the three squads read apart at a glance. */
const TEAM_CLASS: Record<number, string> = {
  1: styles.teamOne,
  2: styles.teamTwo,
  3: styles.teamThree,
};

export function StarringsTeamCard({ group }: StarringsTeamCardProps) {
  return (
    <section className={`${styles.card} ${TEAM_CLASS[group.team] ?? ''}`}>
      <header className={styles.header}>
        <h2 className={styles.teamName}>
          <span className={styles.teamBadge} aria-hidden="true">
            {group.team}
          </span>
          {group.label}
        </h2>
        <span className={styles.count}>
          {group.count} {group.count === 1 ? 'player' : 'players'}
        </span>
      </header>

      {group.tiers.map((tier) => (
        <div key={tier.code} className={styles.tierBlock}>
          <div className={styles.tierHeader}>
            <span className={styles.tierCode}>{tier.code}</span>
            <span className={styles.tierLabel}>
              Tier {tier.tier} · {tier.players.length}
            </span>
          </div>
          <ol className={styles.playerList}>
            {tier.players.map((name) => (
              <li key={name} className={styles.player}>
                {name}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}
