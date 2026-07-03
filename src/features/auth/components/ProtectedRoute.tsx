import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { PendingNotice } from './PendingNotice';
import styles from '../auth.module.css';

/**
 * Gate for approved users. Redirects anonymous visitors to /login and shows a
 * status notice to signed-in-but-unapproved users. Server-side RLS is the real
 * enforcement; this only controls what the UI renders.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, isApproved, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className={styles.routeLoading}>
        <Spinner size="lg" label="Loading…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isApproved) {
    return <PendingNotice status={profile?.status ?? 'pending_approval'} />;
  }

  return <>{children}</>;
}
