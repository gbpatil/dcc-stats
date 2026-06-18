import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './Header.module.css';

export type AppView = 'stats' | 'rotation';

interface HeaderProps {
  season: number;
  onSeasonChange: (season: number) => void;
  availableSeasons: number[];
  view: AppView;
  onViewChange: (view: AppView) => void;
  showRotationTab: boolean;
}

export function Header({
  season,
  onSeasonChange,
  availableSeasons,
  view,
  onViewChange,
  showRotationTab,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <img
              src={`${import.meta.env.BASE_URL}dcc-logo.png`}
              alt="Dundalk Cricket Club Logo"
              className={styles.logoImage}
            />
            <div className={styles.logoText}>
              <h1 className={styles.title}>Dundalk Cricket Club</h1>
              <span className={styles.subtitle}>Season Statistics</span>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          {showRotationTab && (
            <div className={styles.viewToggle} role="tablist" aria-label="View">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'stats'}
                className={`${styles.viewButton} ${view === 'stats' ? styles.viewButtonActive : ''}`}
                onClick={() => onViewChange('stats')}
              >
                📊 Stats
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'rotation'}
                className={`${styles.viewButton} ${view === 'rotation' ? styles.viewButtonActive : ''}`}
                onClick={() => onViewChange('rotation')}
              >
                🔄 Rotation
              </button>
            </div>
          )}
          <div className={styles.seasonSelector}>
            <label htmlFor="season-select" className={styles.seasonLabel}>
              Season
            </label>
            <select
              id="season-select"
              className={styles.seasonSelect}
              value={season}
              onChange={(e) => onSeasonChange(Number(e.target.value))}
            >
              {availableSeasons.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className={styles.decoration}>
        <div className={styles.decorationLine} />
      </div>
    </header>
  );
}
