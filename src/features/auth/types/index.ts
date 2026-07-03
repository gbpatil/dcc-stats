import type { Session, User } from '@supabase/supabase-js';

export type ProfileStatus =
  | 'pending_email'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export type UserRole = 'member' | 'admin' | 'superadmin';

/** Application profile row (public.profiles), 1:1 with an auth user. */
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  signup_reason: string | null;
  status: ProfileStatus;
  role: UserRole;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  signupReason?: string;
}

/** Normalized result for auth actions: `error` is null on success. */
export interface AuthResult {
  error: string | null;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** True while the initial session check or a profile fetch is in flight. */
  loading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  isSuperAdmin: boolean;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
