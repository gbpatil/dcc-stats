import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>🏏</span>
            <span className={styles.brandName}>Dundalk Cricket Club</span>
          </div>
          <span className={styles.tagline}>Leinster Cricket League</span>
        </div>
        
        <div className={styles.right}>
          <div className={styles.dataSource}>
            Data powered by{' '}
            <a 
              href="https://www.cricketstatz.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.link}
            >
              CricketStatz.com
            </a>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>☘️</span>
            Leinster Cricket
          </div>
        </div>
      </div>
    </footer>
  );
}
