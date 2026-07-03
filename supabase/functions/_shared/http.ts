// Tiny HTTP helpers shared by the Edge Functions.

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

/**
 * Verify the shared secret a Database Webhook is configured to send. Edge
 * Functions are public HTTP endpoints, so this is the auth boundary for
 * server-to-server webhook calls. Uses a length-safe constant-time compare.
 */
export function isAuthorizedWebhook(req: Request): boolean {
  const expected = Deno.env.get("WEBHOOK_SECRET");
  const provided = req.headers.get("x-webhook-secret");
  if (!expected || !provided) return false;
  return timingSafeEqual(expected, provided);
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}
