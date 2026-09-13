import { Spinner } from '@/components/ui';
import { useStarrings } from '../../hooks';
import { StarringsTeamCard } from '../StarringsTeamCard';
import styles from './StarringsPage.module.css';

/** Short relative-time label, e.g. "just now", "3h ago", "2d ago". */
function formatUpdated(timestamp: number): string {
  const mins = Math.round((Date.now() - timestamp) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function StarringsPage() {
  const { data, loading, error, lastUpdated, stale, refetch } = useStarrings();

  if (loading && !data) {
    return (
      <div className={styles.stateContainer}>
        <Spinner size="lg" label="Loading Player Starrings..." />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.errorState}>
          <span className={styles.stateIcon}>⚠️</span>
          <h3 className={styles.stateTitle}>Unable to load Player Starrings</h3>
          <p className={styles.stateMessage}>{error}</p>
          <p className={styles.stateHint}>
            The Cricket Leinster page may be temporarily unavailable. Please try again shortly.
          </p>
          <button type="button" className={styles.retryButton} onClick={refetch}>
            ↻ Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.intro}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>⭐</span>
          Player Starrings
        </h1>
        <p className={styles.lead}>
          Each player&apos;s <strong>team designation</strong> for the month, as published by Cricket
          Leinster. The code reads <strong>team.tier</strong> — so <strong>1.2</strong> is the second
          tier of Dundalk 1. Players sharing a code sit at the same tier.
        </p>
        <div className={styles.meta}>
          {data.month && <span className={styles.metaChip}>{data.month}</span>}
          <span className={styles.metaChip}>{data.total} players</span>
          <span className={styles.metaChip}>
            {data.teams.length} {data.teams.length === 1 ? 'team' : 'teams'}
          </span>
          {lastUpdated !== null && (
            <span className={styles.metaChip}>Updated {formatUpdated(lastUpdated)}</span>
          )}
          <button type="button" className={styles.refreshButton} onClick={refetch}>
            ↻ Refresh
          </button>
        </div>

        {stale && (
          <p className={styles.staleNotice} role="status">
            ⚠️ Couldn&apos;t reach Cricket Leinster just now — showing the last saved starrings
            {lastUpdated !== null ? ` from ${formatUpdated(lastUpdated)}` : ''}.
          </p>
        )}
      </div>

      {data.teams.length === 0 ? (
        <p className={styles.empty}>
          No starrings were published for this month.
        </p>
      ) : (
        <div className={styles.teamGrid}>
          {data.teams.map((group) => (
            <StarringsTeamCard key={group.team} group={group} />
          ))}
        </div>
      )}

      <p className={styles.source}>
        Source:{' '}
        <a
          href="https://www.cricketleinster.ie/clubs/dundalk"
          target="_blank"
          rel="noreferrer noopener"
          className={styles.sourceLink}
        >
          Cricket Leinster — Dundalk
        </a>
      </p>
    </div>
  );
}
