// cl-starrings — server-side fetch of the Cricket Leinster club page, returned
// to the browser with CORS headers.
//
// Why this exists: cricketleinster.ie serves no `Access-Control-Allow-Origin`
// header, so the browser cannot read it directly. The public CORS bridges we
// used instead (allorigins, codetabs) proved unreliable for this specific
// origin — codetabs returns Cloudflare 522 consistently and allorigins succeeds
// roughly one attempt in three, taking ~20s to fail. Worse, their error pages
// carry no CORS headers, so a failure surfaces in the browser as an opaque
// "blocked by CORS policy" rather than a readable status.
//
// This function is deliberately NOT a general-purpose proxy: the target URL is a
// hardcoded constant and no part of the request influences it. That removes any
// SSRF / open-relay concern and is why running it without JWT verification is
// safe — the only thing it can ever return is a public web page.

const STARRINGS_PAGE = "https://www.cricketleinster.ie/clubs/dundalk";

/** Give up on the upstream well inside the platform's request timeout. */
const UPSTREAM_TIMEOUT_MS = 10_000;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const abort = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(STARRINGS_PAGE, {
      signal: abort,
      headers: {
        // Some hosts reject requests without a browser-ish UA.
        "user-agent":
          "Mozilla/5.0 (compatible; DCC-Stats/1.0; +https://gbpatil.github.io/dcc-stats/)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: "upstream error", status: upstream.status }),
        { status: 502, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    const html = await upstream.text();

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "text/html; charset=utf-8",
        // The starrings change monthly, so let the browser reuse this for a
        // while rather than re-invoking the function on every view switch.
        "cache-control": "public, max-age=1800",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: "fetch failed", message }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
