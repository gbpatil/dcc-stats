// Shared types for Edge Functions (Deno runtime).

export type ProfileStatus =
  | "pending_email"
  | "pending_approval"
  | "approved"
  | "rejected";

export type UserRole = "member" | "admin" | "superadmin";

export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  signup_reason: string | null;
  status: ProfileStatus;
  role: UserRole;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// Payload shape sent by a Supabase Database Webhook.
export interface DatabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: ProfileRecord | null;
  old_record: ProfileRecord | null;
}
