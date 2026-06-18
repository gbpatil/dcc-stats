// ============================================
// Feature flags - lightweight client-side gating
// ============================================
//
// Enables hidden features via a `?feat=<name>` query param (comma-separated for
// multiple, e.g. ?feat=rotation,foo). The flag is evaluated purely from the
// current URL — nothing is remembered — so a feature is only visible while its
// param is present in the address. This is obscurity, not security (the bundle
// is public on a static host), but it keeps a feature out of casual view.

/**
 * True if the named feature is requested in the current URL's `?feat=<name>`
 * param.
 */
export function isFeatureEnabled(name: string): boolean {
  try {
    const feat = new URLSearchParams(window.location.search).get('feat');
    return feat ? feat.split(',').map((s) => s.trim()).includes(name) : false;
  } catch {
    return false;
  }
}
