// ============================================
// corsFetch - resilient cross-origin GET for the third-party data sources
// ============================================
//
// The public data sources (CricketStatz, Cricket Leinster) are third-party
// origins we don't control, so browser CORS rules decide whether we may read
// the response. Two facts drive this helper:
//
//   1. CricketStatz now serves `Access-Control-Allow-Origin: *` on its report
//      JSON, so it can be fetched *directly* — no bridge needed.
//   2. Cricket Leinster's club page (Player Starrings) sends no CORS headers,
//      so it must be read through something server-side.
//
// We previously routed everything through corsproxy.io. In 2026 that service
// dropped anonymous access (keyless requests return 403 `keyless_legacy_url`),
// which took the production site's stats down. The public bridges we fell back
// to then proved unreliable for cricketleinster.ie specifically, so callers can
// supply their own preferred proxy (see the cl-starrings Edge Function) and the
// public bridges remain only as a last resort.

/** Public CORS bridges, tried in order when nothing better is available. */
const CORS_PROXIES: Array<(url: string) => string> = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * Per-attempt timeout. The public bridges can hang ~20s before returning a
 * Cloudflare error, which would otherwise stack up across the chain and leave
 * the user watching a spinner for a minute. Failing fast lets us reach a
 * working strategy (or the cached fallback) quickly.
 */
const ATTEMPT_TIMEOUT_MS = 8000;

export interface CorsFetchOptions {
  /**
   * Skip the direct attempt for origins known to send no CORS headers, saving
   * a request that is guaranteed to be blocked by the browser.
   */
  skipDirect?: boolean;
  /**
   * Proxies to try before the public bridges — e.g. our own Edge Function.
   * Each entry maps the target URL to the URL that should actually be fetched.
   */
  preferredProxies?: Array<(url: string) => string>;
}

/** fetch with an abort-based timeout, so a hanging bridge can't stall the chain. */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET `url` cross-origin, trying each available strategy in turn: the direct
 * request, then any preferred proxies, then the public bridges. Resolves with
 * the first successful Response; rejects only when every attempt has failed.
 */
export async function corsFetch(
  url: string,
  { skipDirect = false, preferredProxies = [] }: CorsFetchOptions = {},
): Promise<Response> {
  const candidates = [
    ...(skipDirect ? [] : [url]),
    ...preferredProxies.map((toProxyUrl) => toProxyUrl(url)),
    ...CORS_PROXIES.map((toProxyUrl) => toProxyUrl(url)),
  ];

  let lastError: Error = new Error(`No fetch strategy available for ${url}`);

  for (const candidate of candidates) {
    try {
      const response = await fetchWithTimeout(candidate);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      // A CORS rejection, timeout abort, or network failure all surface here;
      // each just means "try the next strategy".
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(`Failed to fetch ${url}: ${lastError.message}`);
}
