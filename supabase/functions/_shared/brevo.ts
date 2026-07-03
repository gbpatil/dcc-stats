// Brevo transactional email client (HTTP API v3). The API key and sender are
// provided as Edge Function secrets — never shipped to the browser.

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: EmailRecipient;
  subject: string;
  html: string;
  text: string;
  replyTo?: EmailRecipient;
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") ?? "DCC Stats";

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Brevo not configured: set BREVO_API_KEY and BREVO_SENDER_EMAIL secrets.",
    );
  }

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [params.to],
      replyTo: params.replyTo,
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Brevo send failed (${response.status}): ${detail}`);
  }
}
