import { useEffect, useState } from 'react';
import styles from './InstallPrompt.module.css';

const DISMISS_KEY = 'dcc-stats-install-dismissed';

// The `beforeinstallprompt` event is not in the standard DOM typings.
interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

/** True once the app is running as an installed, standalone home-screen app. */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes this non-standard flag for home-screen launches.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** True on iPhone/iPad, where installing is a manual Share-sheet action. */
function isIos(): boolean {
  const ua = window.navigator.userAgent;
  const iPhone = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ masquerades as desktop Safari; spot it via touch support.
  const iPadOs =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return iPhone || iPadOs;
}

/**
 * Prompts the user to install the PWA to their home screen.
 * - Android / desktop Chromium: shows an "Install" button wired to the native
 *   `beforeinstallprompt` event.
 * - iOS Safari: no such event exists, so it shows manual Share-sheet
 *   instructions instead.
 * Dismissal is remembered in localStorage, and the prompt hides entirely once
 * the app is already installed.
 */
export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true',
  );
  // Device/display checks are fixed for the page session, so resolve them once.
  // iOS never fires `beforeinstallprompt`, so it always falls back to the hint.
  const [showIosHint] = useState(() => isIos() && !isStandalone());

  useEffect(() => {
    if (dismissed || isStandalone()) return;

    // Android / desktop Chromium: capture the native prompt so we can trigger
    // it from our own button instead of the browser's mini-infobar.
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    // Clear the button the moment the app is actually installed.
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  if (dismissed) return null;

  // Android / Chromium: one-tap install.
  if (installEvent) {
    return (
      <aside className={styles.banner} aria-label="Install DCC Stats">
        <span className={styles.icon}>
          <DownloadIcon />
        </span>
        <p className={styles.text}>Install DCC Stats for quick, full-screen access.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.install} onClick={install}>
            Install
          </button>
          <button
            type="button"
            className={styles.dismiss}
            onClick={dismiss}
            aria-label="Dismiss install prompt"
          >
            &times;
          </button>
        </div>
      </aside>
    );
  }

  // iOS Safari: manual Share → Add to Home Screen.
  if (showIosHint) {
    return (
      <aside className={styles.banner} aria-label="Install DCC Stats">
        <span className={styles.icon}>
          <ShareIcon />
        </span>
        <p className={styles.text}>
          Install this app: tap the Share button{' '}
          <ShareIcon className={styles.inlineGlyph} /> then{' '}
          <strong>Add to Home Screen</strong>.
        </p>
        <button
          type="button"
          className={styles.dismiss}
          onClick={dismiss}
          aria-label="Dismiss install prompt"
        >
          &times;
        </button>
      </aside>
    );
  }

  return null;
}

function DownloadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v13" />
      <polyline points="8 7 12 3 16 7" />
      <path d="M8 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}
