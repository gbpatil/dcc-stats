import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components';
import styles from '../auth.module.css';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centered, branded card layout used by all auth/status screens. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.shellTop}>
        <Link to="/" className={styles.backLink}>
          ← Back to stats
        </Link>
        <ThemeToggle />
      </header>
      <main className={styles.shellMain}>
        <div className={styles.card}>
          <img
            src={`${import.meta.env.BASE_URL}dcc-logo.png`}
            alt="Dundalk Cricket Club"
            className={styles.cardLogo}
          />
          <h1 className={styles.cardTitle}>{title}</h1>
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
          {children}
        </div>
        {footer && <div className={styles.cardFooter}>{footer}</div>}
      </main>
    </div>
  );
}
