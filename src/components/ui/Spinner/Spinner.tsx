import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.ring} />
      </div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
