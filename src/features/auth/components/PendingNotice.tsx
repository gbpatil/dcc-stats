import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthShell } from './AuthShell';
import type { ProfileStatus } from '../types';
import styles from '../auth.module.css';

const MESSAGES: Record<ProfileStatus, { icon: string; title: string; text: string }> = {
  pending_email: {
    icon: '✉️',
    title: 'Confirm your email',
    text: 'Please click the verification link we emailed you to continue.',
  },
  pending_approval: {
    icon: '⏳',
    title: 'Awaiting approval',
    text: "Your email is verified. An admin will review your request shortly — you'll get an email once it's decided.",
  },
  rejected: {
    icon: '🚫',
    title: 'Access not approved',
    text: 'Your request for admin access was not approved. If you think this is a mistake, please contact the club.',
  },
  approved: {
    icon: '✅',
    title: 'Approved',
    text: 'Your account is approved.',
  },
};

/** Status screen shown to signed-in users who are not (yet) approved. */
export function PendingNotice({ status }: { status: ProfileStatus }) {
  const { signOut } = useAuth();
  const info = MESSAGES[status] ?? MESSAGES.pending_approval;

  return (
    <AuthShell title={info.title}>
      <div className={styles.notice}>
        <span className={styles.noticeIcon} aria-hidden="true">
          {info.icon}
        </span>
        <p className={styles.noticeText}>{info.text}</p>
        <div className={styles.actions}>
          {status === 'approved' && (
            <Link to="/admin" className={styles.secondaryButton}>
              Go to admin
            </Link>
          )}
          <Link to="/" className={styles.secondaryButton}>
            Back to stats
          </Link>
          <button type="button" className={styles.secondaryButton} onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
