import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';
import { PendingNotice } from '../components/PendingNotice';
import { humanizeAuthError } from '../utils/authErrors';
import { validateEmail } from '../utils/validation';
import styles from '../auth.module.css';

interface LoginLocationState {
  from?: string;
}

export function LoginPage() {
  const { signIn, isAuthenticated, isApproved, loading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as LoginLocationState | null)?.from ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Send approved users straight to their destination.
  useEffect(() => {
    if (!loading && isAuthenticated && isApproved) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, isAuthenticated, isApproved, navigate, redirectTo]);

  // A signed-in but unapproved user sees their status, not the form.
  if (isAuthenticated && !loading && !isApproved) {
    return <PendingNotice status={profile?.status ?? 'pending_approval'} />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = password ? null : 'Password is required.';
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    setSubmitting(true);
    setFormError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setFormError(humanizeAuthError(error));
  };

  return (
    <AuthShell
      title="Admin sign in"
      subtitle="Sign in to access restricted club data."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className={styles.inlineLink}>
            Request access
          </Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {formError && (
          <div className={`${styles.alert} ${styles.alertError}`} role="alert">
            {formError}
          </div>
        )}
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        <button type="submit" className={styles.button} disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
