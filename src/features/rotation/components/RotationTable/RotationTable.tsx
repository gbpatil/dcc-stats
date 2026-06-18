import type { RotationPlayer } from '../../types';
import styles from './RotationTable.module.css';

interface RotationTableProps {
  players: RotationPlayer[];
}

export function RotationTable({ players }: RotationTableProps) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ minWidth: '50px' }}>#</th>
            <th style={{ minWidth: '180px' }}>Player</th>
            <th style={{ minWidth: '70px' }} title="Player Starrings designation (team.tier)">
              Starring
            </th>
            <th style={{ minWidth: '120px' }} title="Team last played for">Last team</th>
            <th style={{ minWidth: '60px' }} title="Matches played this season">M</th>
            <th style={{ minWidth: '90px' }} title="Underplay score (higher = fewer games)">
              Underplay
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, index) => (
            <tr key={p.name} className={p.needsGames ? styles.needsGames : ''}>
              <td className={styles.rankCell}>{index + 1}</td>
              <td className={styles.playerCell}>
                <span className={styles.playerName}>{p.name}</span>
                {p.needsGames && <span className={styles.needsBadge}>Needs games</span>}
                {!p.played && (
                  <span className={styles.zeroBadge} title="No matches recorded this season">
                    0 games
                  </span>
                )}
              </td>
              <td className={styles.tierCell}>{p.starringCode ?? '–'}</td>
              <td>{p.lastTeam || '–'}</td>
              <td className={styles.scoreColumn}>{p.matches}</td>
              <td className={styles.scoreColumn}>{p.score.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
