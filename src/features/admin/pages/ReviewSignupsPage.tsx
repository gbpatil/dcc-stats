import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '@/components';
import { useSignupReview } from '../hooks/useSignupReview';
import type { ReviewDecision } from '../hooks/useSignupReview';
import styles from '../admin.module.css';

export function ReviewSignupsPage() {
  const { id: focusId } = useParams();
  const { requests, loading, error, actingId, review, refresh } = useSignupReview();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDecision = async (id: string, decision: ReviewDecision) => {
    setActionError(null);
    const message = await review(id, decision);
    if (message) setActionError(message);
  };

  return (
    <section className={styles.page}>
      <div className={styles.reviewHeader}>
        <div className={styles.pageHeader}>
          <span className={styles.pageIcon} aria-hidden="true">
            ✅
          </span>
          <div>
            <h1 className={styles.pageTitle}>Review signups</h1>
            <p className={styles.pageDescription}>Approve or reject pending access requests.</p>
          </div>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => void refresh()}>
          Refresh
        </button>
      </div>

      {actionError && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingWrap}>
          <Spinner size="lg" label="Loading requests…" />
        </div>
      ) : error ? (
        <div className={styles.errorState}>Couldn&apos;t load requests: {error}</div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState}>🎉 No pending requests right now.</div>
      ) : (
        <div className={styles.requestList}>
          {requests.map((request) => {
            const busy = actingId === request.id;
            return (
              <article
                key={request.id}
                className={`${styles.request} ${request.id === focusId ? styles.requestFocus : ''}`}
              >
                <div className={styles.requestGrid}>
                  <span className={styles.requestKey}>Email</span>
                  <span className={styles.requestValue}>{request.email}</span>
                  <span className={styles.requestKey}>Name</span>
                  <span className={styles.requestValue}>{request.full_name ?? '—'}</span>
                  <span className={styles.requestKey}>Phone</span>
                  <span className={styles.requestValue}>{request.phone ?? '—'}</span>
                  <span className={styles.requestKey}>Reason</span>
                  <span className={styles.requestValue}>{request.signup_reason ?? '—'}</span>
                  <span className={styles.requestKey}>Requested</span>
                  <span className={styles.requestValue}>
                    {new Date(request.created_at).toLocaleString()}
                  </span>
                </div>
                <div className={styles.requestActions}>
                  <button
                    type="button"
                    className={styles.approve}
                    disabled={busy}
                    onClick={() => void handleDecision(request.id, 'approve')}
                  >
                    {busy ? 'Working…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className={styles.reject}
                    disabled={busy}
                    onClick={() => void handleDecision(request.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
