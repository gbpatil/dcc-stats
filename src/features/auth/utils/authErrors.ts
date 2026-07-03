// Map raw Supabase auth error messages to friendly, user-facing copy without
// leaking internal detail.
export function humanizeAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the verification link.';
  }
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (normalized.includes('password')) {
    // Password-policy messages are safe and useful to surface verbatim.
    return message;
  }
  return message || 'Something went wrong. Please try again.';
}
