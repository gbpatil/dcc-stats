import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';
import { humanizeAuthError } from '../utils/authErrors';
import { validateEmail, validatePassword, validateRequired } from '../utils/validation';
import styles from '../auth.module.css';

type FieldKey = 'fullName' | 'email' | 'password' | 'confirm' | 'phone' | 'reason';

const EMPTY_FORM: Record<FieldKey, string> = {
  fullName: '',
  email: '',
  password: '',
  confirm: '',
  phone: '',
  reason: '',
};

export function SignupPage() {
  const { signUp } = useAuth();
  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string | null>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update =
    (key: FieldKey) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Partial<Record<FieldKey, string | null>> = {
      fullName: validateRequired(form.fullName, 'Full name'),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: form.password === form.confirm ? null : 'Passwords do not match.',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setFormError(null);
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      phone: form.phone,
      signupReason: form.reason,
    });
    setSubmitting(false);
    if (error) {
      setFormError(humanizeAuthError(error));
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AuthShell title="Check your email">
        <div className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">
            ✉️
          </span>
          <p className={styles.noticeText}>
            We&apos;ve sent a confirmation link to <strong>{form.email}</strong>. Click it to verify
            your email — then an admin will review your request.
          </p>
          <Link to="/" className={styles.secondaryButton}>
            Back to stats
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Request admin access"
      subtitle="Sign up, verify your email, then await admin approval."
      footer={
        <>
          Already have access?{' '}
          <Link to="/login" className={styles.inlineLink}>
            Sign in
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
          id="fullName"
          label="Full name"
          autoComplete="name"
          value={form.fullName}
          onChange={update('fullName')}
          error={errors.fullName}
          required
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          required
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          required
        />
        <FormField
          id="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={update('confirm')}
          error={errors.confirm}
          required
        />
        <FormField
          id="phone"
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={update('phone')}
        />
        <div className={styles.field}>
          <label htmlFor="reason" className={styles.label}>
            Reason for access (optional)
          </label>
          <textarea
            id="reason"
            className={styles.textarea}
            rows={3}
            value={form.reason}
            onChange={update('reason')}
          />
        </div>
        <button type="submit" className={styles.button} disabled={submitting}>
          {submitting ? 'Creating account…' : 'Request access'}
        </button>
      </form>
    </AuthShell>
  );
}
