// Lightweight, dependency-free form validators. Each returns an error message
// string, or null when the value is valid. Server-side (Supabase) policies are
// the real enforcement; these give immediate, friendly client feedback.

export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Email is required.';
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Use upper- and lower-case letters and at least one number.';
  }
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required.`;
}
