// ============================================
// Feature flags - lightweight client-side gating
// ============================================
//
// Enables hidden features via a `?feat=<name>` query param (comma-separated for
// multiple, e.g. ?feat=rotation,foo). Once seen, the flag is remembered on the
// device in localStorage so the shareable link keeps working after navigation or
// reload. This is obscurity, not security — the bundle is public on a static
// host — but it keeps a feature out of casual view.

const STORAGE_PREFIX = 'dcc-feat-';

/**
 * True only if the feature is explicitly requested in the current URL's
 * `?feat=<name>` param (does not consider what was remembered previously).
 */
export function isFeatureRequestedInUrl(name: string): boolean {
  try {
    const feat = new URLSearchParams(window.location.search).get('feat');
    return feat ? feat.split(',').map((s) => s.trim()).includes(name) : false;
  } catch {
    return false;
  }
}

/**
 * True if the named feature is enabled, either via the current URL's
 * `?feat=<name>` param or because it was unlocked previously on this device.
 */
export function isFeatureEnabled(name: string): boolean {
  try {
    if (isFeatureRequestedInUrl(name)) {
      localStorage.setItem(STORAGE_PREFIX + name, 'true');
      return true;
    }
    return localStorage.getItem(STORAGE_PREFIX + name) === 'true';
  } catch {
    return false;
  }
}
