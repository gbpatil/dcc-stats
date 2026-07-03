import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { AuthContext } from './context';
import type { AuthContextValue, AuthResult, Profile, SignUpInput } from '../types';

async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('Failed to load profile:', error.message);
    return null;
  }
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Start "initialized" already when there are no credentials so the public
  // site renders without waiting on an auth check that will never run.
  const [initializing, setInitializing] = useState(isSupabaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);

  const user = session?.user ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    // All state updates happen inside async/subscription callbacks (never
    // synchronously in the effect body) to avoid cascading renders.
    const applySession = async (nextSession: Session | null) => {
      setSession(nextSession);
      const id = nextSession?.user?.id;
      if (!id) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      const nextProfile = await fetchProfile(id);
      if (!active) return;
      setProfile(nextProfile);
      setProfileLoading(false);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      await applySession(data.session);
      if (active) setInitializing(false);
    });

    // Keep the callback lightweight (Supabase guidance); profile loading is
    // deferred inside applySession rather than awaited in the callback itself.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const id = session?.user?.id;
    if (!id) {
      setProfile(null);
      return;
    }
    setProfile(await fetchProfile(id));
  }, [session?.user?.id]);

  const signUp = useCallback(async (input: SignUpInput): Promise<AuthResult> => {
    // Supabase appends `?code=...` to this URL after the user confirms; landing
    // at the app root lets detectSessionInUrl exchange it cleanly.
    const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const { error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        emailRedirectTo,
        data: {
          full_name: input.fullName.trim(),
          phone: input.phone?.trim() ?? '',
          signup_reason: input.signupReason?.trim() ?? '',
        },
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading: initializing || profileLoading,
      isAuthenticated: Boolean(session),
      isApproved: profile?.status === 'approved',
      isSuperAdmin: profile?.role === 'superadmin',
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, user, profile, initializing, profileLoading, signUp, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
