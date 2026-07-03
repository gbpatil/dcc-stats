import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './AuthMenu.module.css';

/** Compact auth control for the site header: sign-in link or signed-in menu. */
export function AuthMenu() {
  const { loading, isAuthenticated, isApproved, signOut } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <Link to="/login" className={styles.signIn}>
        Sign in
      </Link>
    );
  }

  return (
    <div className={styles.menu}>
      {isApproved ? (
        <Link to="/admin" className={styles.adminLink}>
          Admin
        </Link>
      ) : (
        <span className={styles.pending} title="Awaiting admin approval">
          Pending
        </span>
      )}
      <button type="button" className={styles.signOut} onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}
