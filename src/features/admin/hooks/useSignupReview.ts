import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/features/auth';

export type ReviewDecision = 'approve' | 'reject';

interface SignupReview {
  requests: Profile[];
  loading: boolean;
  error: string | null;
  /** Id of the request currently being acted on, or null. */
  actingId: string | null;
  refresh: () => Promise<void>;
  /** Returns an error message on failure, or null on success. */
  review: (id: string, decision: ReviewDecision) => Promise<string | null>;
}

function queryPending() {
  return supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: true });
}

/** Loads the pending-approval queue and applies superadmin decisions via RPC. */
export function useSignupReview(): SignupReview {
  const [requests, setRequests] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  // Initial load — state is set inside the promise callback, not synchronously.
  useEffect(() => {
    let active = true;
    queryPending().then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError(queryError.message);
      setRequests((data as Profile[] | null) ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await queryPending();
    if (queryError) setError(queryError.message);
    setRequests((data as Profile[] | null) ?? []);
    setLoading(false);
  }, []);

  const review = useCallback(
    async (id: string, decision: ReviewDecision): Promise<string | null> => {
      setActingId(id);
      // Server-side enforced: review_signup() checks is_superadmin() and only
      // acts on rows still pending. A Database Webhook then emails the user.
      const { error: rpcError } = await supabase.rpc('review_signup', {
        target_id: id,
        decision,
      });
      setActingId(null);
      if (rpcError) return rpcError.message;
      setRequests((prev) => prev.filter((request) => request.id !== id));
      return null;
    },
    [],
  );

  return { requests, loading, error, actingId, refresh, review };
}
