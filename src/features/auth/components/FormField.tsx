import type { InputHTMLAttributes } from 'react';
import styles from '../auth.module.css';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

/** Labelled text input with inline validation error + ARIA wiring. */
export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...inputProps}
      />
      {error && (
        <span id={errorId} className={styles.fieldError} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
