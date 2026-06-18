import { Spinner } from '@/components/ui';
import { useRotationData } from '../../hooks';
import { RotationTable } from '../RotationTable';
import styles from './RotationPage.module.css';

interface RotationPageProps {
  season: number;
}

/** Short relative-time label, e.g. "just now", "3h ago", "2d ago". */
function formatUpdated(timestamp: number): string {
  const mins = Math.round((Date.now() - timestamp) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function RotationPage({ season }: RotationPageProps) {
  const { data, loading, error, lastUpdated, refetch } = useRotationData(season);

  if (loading) {
    return (
      <div className={styles.stateContainer}>
        <Spinner size="lg" label="Loading rotation data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.errorState}>
          <span className={styles.stateIcon}>⚠️</span>
          <h3 className={styles.stateTitle}>Unable to load rotation data</h3>
          <p className={styles.stateMessage}>{error}</p>
          <p className={styles.stateHint}>
            The Player Starrings page or stats feed may be temporarily unavailable. Please try again.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const needsCount = data.players.filter((p) => p.needsGames).length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.intro}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>🔄</span>
          Fair Rotation
        </h1>
        <p className={styles.lead}>
          Every club player ranked by how <strong>underplayed</strong> they are this season — fewest
          matches first. Players who have played below the club median (<strong>{data.median}</strong>{' '}
          matches) are highlighted as needing game time, so selectors can decide who to rotate in for
          the next fixture.
        </p>
        <div className={styles.meta}>
          {data.month && <span className={styles.metaChip}>Starrings: {data.month}</span>}
          <span className={styles.metaChip}>Season: {season}</span>
          <span className={styles.metaChip}>{data.players.length} players</span>
          <span className={styles.metaChip}>{needsCount} need games</span>
          {lastUpdated !== null && (
            <span className={styles.metaChip}>Updated {formatUpdated(lastUpdated)}</span>
          )}
          <button type="button" className={styles.refreshButton} onClick={refetch}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {data.players.length === 0 ? (
        <p className={styles.empty}>No player data available for this season.</p>
      ) : (
        <RotationTable players={data.players} />
      )}
    </div>
  );
}
