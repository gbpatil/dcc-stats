// notify-user — invoked by a Database Webhook on public.profiles UPDATE.
// When the admin's decision moves a user into 'approved' or 'rejected', email
// the user the outcome.

import { corsHeaders, isAuthorizedWebhook, jsonResponse } from "../_shared/http.ts";
import { sendEmail } from "../_shared/brevo.ts";
import { userDecisionEmail } from "../_shared/email-templates.ts";
import type { DatabaseWebhookPayload } from "../_shared/types.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }
  if (!isAuthorizedWebhook(req)) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  let payload: DatabaseWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }

  const record = payload.record;
  const previous = payload.old_record;

  const decided =
    payload.type === "UPDATE" &&
    (record?.status === "approved" || record?.status === "rejected") &&
    previous?.status !== record?.status;

  if (!decided || !record) {
    return jsonResponse({ skipped: true }, 200);
  }

  const siteUrl = Deno.env.get("SITE_URL") ?? "";
  const email = userDecisionEmail(record, record.status === "approved", siteUrl);

  try {
    await sendEmail({
      to: { email: record.email, name: record.full_name ?? undefined },
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (error) {
    console.error("notify-user: send failed", error);
    return jsonResponse({ error: "email send failed" }, 500);
  }

  return jsonResponse({ ok: true }, 200);
});
