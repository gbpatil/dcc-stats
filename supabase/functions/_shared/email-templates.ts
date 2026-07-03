// HTML/text email templates. All user-supplied values are HTML-escaped to
// prevent injection into the rendered email.

import type { ProfileRecord } from "./types.ts";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const BRAND = "#1E8449";

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f5f6;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f6;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e4e6;">
        <tr><td style="background:${BRAND};padding:20px 28px;">
          <span style="color:#ffffff;font-size:20px;font-weight:bold;">Dundalk Cricket Club</span>
          <span style="color:#F1C40F;font-size:13px;letter-spacing:.08em;text-transform:uppercase;display:block;margin-top:2px;">Admin</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#1a1a1a;">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#fafbfb;border-top:1px solid #eee;color:#8a8a8a;font-size:12px;">
          You are receiving this because of admin activity on the DCC-Stats site.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">${escapeHtml(label)}</a>`;
}

/** Sent to the admin when a user has verified their email and awaits review. */
export function adminReviewEmail(
  profile: ProfileRecord,
  reviewUrl: string,
): RenderedEmail {
  const rows: Array<[string, string]> = [
    ["Email", profile.email],
    ["Name", profile.full_name ?? "—"],
    ["Phone", profile.phone ?? "—"],
    ["Reason", profile.signup_reason ?? "—"],
    ["Requested", new Date(profile.created_at).toUTCString()],
  ];
  const detailHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#8a8a8a;font-size:13px;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(v)}</td></tr>`,
    )
    .join("");

  const html = layout(
    "New signup awaiting approval",
    `<p style="margin:0 0 16px;font-size:14px;">A new user verified their email and is requesting admin access:</p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">${detailHtml}</table>
     <p style="margin:0 0 24px;">${button(reviewUrl, "Review this request")}</p>
     <p style="margin:0;color:#8a8a8a;font-size:12px;">You will be asked to sign in as admin before approving or rejecting.</p>`,
  );

  const text = [
    "New signup awaiting approval:",
    ...rows.map(([k, v]) => `  ${k}: ${v}`),
    "",
    `Review: ${reviewUrl}`,
    "(You must sign in as admin to approve or reject.)",
  ].join("\n");

  return { subject: `DCC Admin · approval needed for ${profile.email}`, html, text };
}

/** Sent to the user once the admin approves or rejects their signup. */
export function userDecisionEmail(
  profile: ProfileRecord,
  approved: boolean,
  siteUrl: string,
): RenderedEmail {
  const name = profile.full_name?.split(" ")[0] ?? "there";
  const loginUrl = `${siteUrl.replace(/\/$/, "")}/#/login`;

  if (approved) {
    return {
      subject: "Your DCC-Stats admin access is approved",
      html: layout(
        "You're approved 🎉",
        `<p style="margin:0 0 16px;font-size:14px;">Hi ${escapeHtml(name)}, your request for admin access to DCC-Stats has been approved.</p>
         <p style="margin:0 0 24px;">${button(loginUrl, "Sign in")}</p>`,
      ),
      text: `Hi ${name}, your DCC-Stats admin access has been approved.\n\nSign in: ${loginUrl}`,
    };
  }

  return {
    subject: "Update on your DCC-Stats access request",
    html: layout(
      "Request not approved",
      `<p style="margin:0 0 16px;font-size:14px;">Hi ${escapeHtml(name)}, thanks for your interest. Your request for admin access to DCC-Stats was not approved at this time.</p>
       <p style="margin:0;color:#8a8a8a;font-size:13px;">If you believe this is a mistake, please reach out to the club.</p>`,
    ),
    text: `Hi ${name}, your request for admin access to DCC-Stats was not approved at this time.`,
  };
}
