import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from '@/components';
import { useAuth } from '../hooks/useAuth';
import styles from '../auth.module.css';

/** Gate for superadmin-only screens (e.g. the signup review queue). */
export function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className={styles.routeLoading}>
        <Spinner size="lg" label="Loading…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
