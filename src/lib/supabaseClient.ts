import { createClient } from '@supabase/supabase-js';

// PUBLIC, client-safe config. The anon key is meant to ship in the bundle;
// all data access is enforced server-side by Row Level Security.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Whether real Supabase credentials are present. When false (e.g. a fresh
 * clone with no .env.local), the public stats site still works — only the
 * admin/auth features degrade gracefully.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Fall back to harmless placeholders so createClient never throws at import
// time; no network call happens until an auth/data method is actually used.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      // PKCE returns the auth `code` in the query string (not the URL hash),
      // so it does not collide with HashRouter's use of `#`.
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);

// Auth-redirect detection. Captured synchronously at module load, before
// detectSessionInUrl strips the params from the URL.
const redirectParams =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

/**
 * True when the app was opened as the target of a Supabase auth redirect
 * (email confirmation / magic link / error).
 */
export const isAuthRedirect: boolean =
  redirectParams.has('code') ||
  redirectParams.has('error') ||
  redirectParams.has('error_description');

/** Error description from a failed auth redirect (e.g. expired link), if any. */
export const authRedirectError: string | null =
  redirectParams.get('error_description') ?? redirectParams.get('error');
