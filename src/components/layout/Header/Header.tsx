import styles from './Header.module.css';

interface HeaderProps {
  season: number;
  onSeasonChange: (season: number) => void;
  availableSeasons: number[];
}

export function Header({ season, onSeasonChange, availableSeasons }: HeaderProps) {
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
        </div>
      </div>
      
      <div className={styles.decoration}>
        <div className={styles.decorationLine} />
      </div>
    </header>
  );
}
