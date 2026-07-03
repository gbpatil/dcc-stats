import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import styles from '../admin.module.css';

const SECTIONS = [
  { to: '/admin/analytics', icon: '📈', title: 'Advanced Analytics', text: 'Internal stats and trends.' },
  { to: '/admin/players', icon: '🧑', title: 'Player Management', text: 'Profiles, contacts, availability.' },
  { to: '/admin/selection', icon: '📋', title: 'Selection & Match-day', text: 'Team selection and planning.' },
  { to: '/admin/data', icon: '🗂️', title: 'Data & Content', text: 'Curate reports and announcements.' },
];

export function AdminHome() {
  const { profile, isSuperAdmin } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div>
      <div className={styles.welcome}>
        <h1 className={styles.welcomeTitle}>Welcome, {firstName}</h1>
        <p className={styles.welcomeSub}>Restricted admin tools for Dundalk Cricket Club.</p>
      </div>
      <div className={styles.cardGrid}>
        {SECTIONS.map((section) => (
          <Link key={section.to} to={section.to} className={styles.card}>
            <span className={styles.cardIcon} aria-hidden="true">
              {section.icon}
            </span>
            <span className={styles.cardTitle}>{section.title}</span>
            <span className={styles.cardText}>{section.text}</span>
          </Link>
        ))}
        {isSuperAdmin && (
          <Link to="/admin/review" className={styles.card}>
            <span className={styles.cardIcon} aria-hidden="true">
              ✅
            </span>
            <span className={styles.cardTitle}>Review signups</span>
            <span className={styles.cardText}>Approve or reject access requests.</span>
          </Link>
        )}
      </div>
    </div>
  );
}
