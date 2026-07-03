import { Link, NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/components';
import { useAuth } from '@/features/auth';
import styles from '../admin.module.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈', end: false },
  { to: '/admin/players', label: 'Players', icon: '🧑', end: false },
  { to: '/admin/selection', label: 'Selection', icon: '📋', end: false },
  { to: '/admin/data', label: 'Data', icon: '🗂️', end: false },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;
}

/** Shell for the admin area: section nav + top bar + routed content. */
export function AdminLayout() {
  const { user, isSuperAdmin, signOut } = useAuth();

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src={`${import.meta.env.BASE_URL}dcc-logo.png`} alt="" className={styles.brandLogo} />
          <span className={styles.brandText}>DCC Admin</span>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {isSuperAdmin && (
            <NavLink to="/admin/review" className={navLinkClass}>
              <span aria-hidden="true">✅</span>
              Review signups
            </NavLink>
          )}
        </nav>
      </aside>

      <div className={styles.body}>
        <header className={styles.topbar}>
          <Link to="/" className={styles.topbarLink}>
            ← Back to stats
          </Link>
          <div className={styles.topbarRight}>
            {user?.email && <span className={styles.userEmail}>{user.email}</span>}
            <ThemeToggle />
            <button type="button" className={styles.signOut} onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
