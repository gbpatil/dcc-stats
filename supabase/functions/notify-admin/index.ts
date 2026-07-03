// notify-admin — invoked by a Database Webhook on public.profiles UPDATE.
// When a user transitions into 'pending_approval' (i.e. has just verified their
// email), email the admin a review link.

import { corsHeaders, isAuthorizedWebhook, jsonResponse } from "../_shared/http.ts";
import { sendEmail } from "../_shared/brevo.ts";
import { adminReviewEmail } from "../_shared/email-templates.ts";
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

  // Act only on the transition into pending_approval (idempotent). This happens
  // via UPDATE for the normal email-confirmation flow, or via INSERT when a
  // profile is created already in pending_approval (auto-confirmed, OAuth, or
  // admin-created users). Requires the webhook to fire on Insert + Update.
  const becamePending =
    (payload.type === "UPDATE" || payload.type === "INSERT") &&
    record?.status === "pending_approval" &&
    previous?.status !== "pending_approval";

  if (!becamePending || !record) {
    return jsonResponse({ skipped: true }, 200);
  }

  const adminEmail = Deno.env.get("ADMIN_EMAIL");
  const siteUrl = Deno.env.get("SITE_URL") ?? "";
  if (!adminEmail) {
    return jsonResponse({ error: "ADMIN_EMAIL not configured" }, 500);
  }

  const reviewUrl = `${siteUrl.replace(/\/$/, "")}/#/admin/review/${record.id}`;
  const email = adminReviewEmail(record, reviewUrl);

  try {
    await sendEmail({
      to: { email: adminEmail, name: "DCC Admin" },
      replyTo: { email: record.email, name: record.full_name ?? undefined },
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (error) {
    console.error("notify-admin: send failed", error);
    return jsonResponse({ error: "email send failed" }, 500);
  }

  return jsonResponse({ ok: true }, 200);
});
