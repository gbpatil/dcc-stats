import styles from '../admin.module.css';

interface PagePlaceholderProps {
  icon: string;
  title: string;
  description: string;
  bullets?: string[];
}

/** Access-gated scaffold for an admin section whose content is not built yet. */
export function PagePlaceholder({ icon, title, description, bullets }: PagePlaceholderProps) {
  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <span className={styles.pageIcon} aria-hidden="true">
          {icon}
        </span>
        <div>
          <h1 className={styles.pageTitle}>{title}</h1>
          <p className={styles.pageDescription}>{description}</p>
        </div>
      </div>
      <div className={styles.placeholderPanel}>
        <span className={styles.placeholderBadge}>Coming soon</span>
        {bullets && bullets.length > 0 && (
          <ul className={styles.placeholderList}>
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
