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
//      so it still needs a public CORS bridge.
//
// We previously routed everything through corsproxy.io. In 2026 that service
// dropped anonymous access (keyless requests now return 403
// `keyless_legacy_url`), which took the production site's stats down. To avoid
// being at the mercy of a single free proxy again, we try the direct request
// first and only then fall back through a list of bridges, returning the first
// response that succeeds.

/** Public CORS bridges, tried in order when a direct request can't be read. */
const CORS_PROXIES: Array<(url: string) => string> = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

export interface CorsFetchOptions {
  /**
   * Skip the direct attempt for origins known to send no CORS headers, saving
   * a request that is guaranteed to be blocked by the browser.
   */
  skipDirect?: boolean;
}

/**
 * GET `url` cross-origin, falling back through the CORS bridges if the direct
 * request is blocked or fails. Resolves with the first successful Response;
 * rejects only when every attempt has failed.
 */
export async function corsFetch(
  url: string,
  { skipDirect = false }: CorsFetchOptions = {}
): Promise<Response> {
  const candidates = [
    ...(skipDirect ? [] : [url]),
    ...CORS_PROXIES.map((toProxyUrl) => toProxyUrl(url)),
  ];

  let lastError: Error = new Error(`No fetch strategy available for ${url}`);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      // A CORS rejection or network failure surfaces as a TypeError here; both
      // just mean "try the next strategy".
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(`Failed to fetch ${url}: ${lastError.message}`);
}
