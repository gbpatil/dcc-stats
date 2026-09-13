import { useState } from 'react';
import { RotationPage } from '@/features/rotation';
import { useAvailableSeasons } from '@/features/stats';
import styles from '../admin.module.css';

/**
 * Admin host for the Fair Rotation view. Rotation is a selection aid rather than
 * public information, so it lives behind the admin gate instead of the public
 * header. The admin shell has no season control of its own, so this page carries
 * its own selector.
 */
export function TeamRotationPage() {
  const [season, setSeason] = useState(() => new Date().getFullYear());
  const availableSeasons = useAvailableSeasons();

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <span className={styles.pageIcon} aria-hidden="true">
          🔄
        </span>
        <div>
          <h1 className={styles.pageTitle}>Fair Rotation</h1>
          <p className={styles.pageDescription}>
            Who is underplayed this season, to help plan the next selection.
          </p>
        </div>
        <label className={styles.seasonField}>
          <span className={styles.seasonLabel}>Season</span>
          <select
            className={styles.seasonSelect}
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
          >
            {availableSeasons.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <RotationPage season={season} />
    </section>
  );
}
