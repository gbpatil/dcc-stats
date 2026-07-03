import { Link } from 'react-router-dom';
import { Spinner } from '@/components';
import { authRedirectError } from '@/lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { AuthShell } from '../components/AuthShell';
import styles from '../auth.module.css';

/**
 * Landing screen after an email-confirmation redirect. The Supabase client
 * exchanges the auth code automatically (detectSessionInUrl); this page just
 * reports the resulting state.
 */
export function ConfirmPage() {
  const { loading, isAuthenticated, isApproved, profile } = useAuth();

  if (authRedirectError) {
    return (
      <AuthShell title="Confirmation failed">
        <div className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">
            ⚠️
          </span>
          <p className={styles.noticeText}>
            This link is invalid or has expired. Please try signing up again.
          </p>
          <Link to="/signup" className={styles.secondaryButton}>
            Back to sign up
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (loading) {
    return (
      <AuthShell title="Confirming…">
        <div className={styles.routeLoading}>
          <Spinner size="lg" label="Verifying your email…" />
        </div>
      </AuthShell>
    );
  }

  if (isAuthenticated && isApproved) {
    return (
      <AuthShell title="You're all set">
        <div className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">
            ✅
          </span>
          <p className={styles.noticeText}>Your email is verified and your access is approved.</p>
          <Link to="/admin" className={styles.secondaryButton}>
            Go to admin
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (isAuthenticated) {
    const rejected = profile?.status === 'rejected';
    return (
      <AuthShell title={rejected ? 'Access not approved' : 'Email verified'}>
        <div className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">
            {rejected ? '🚫' : '⏳'}
          </span>
          <p className={styles.noticeText}>
            {rejected
              ? 'Your request for admin access was not approved.'
              : "Thanks — your email is verified. An admin will review your request and you'll get an email with the decision."}
          </p>
          <Link to="/" className={styles.secondaryButton}>
            Back to stats
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Email verified">
      <div className={styles.notice}>
        <span className={styles.noticeIcon} aria-hidden="true">
          ✅
        </span>
        <p className={styles.noticeText}>Your email is verified. You can now sign in.</p>
        <Link to="/login" className={styles.secondaryButton}>
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
