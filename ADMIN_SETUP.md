# Admin Panel — Setup Runbook

This guide covers the **one-time, human-only** setup for the admin panel (Supabase
+ Brevo dashboards and CLI). All application code, SQL, and Edge Functions are
already in the repo. Work top-to-bottom; each step lists exactly what to paste.

**Architecture recap:** the site stays static on GitHub Pages. Supabase provides
auth + Postgres + Edge Functions; Brevo sends email. The browser only ever holds
the **public** anon key — all data is protected by Row Level Security (RLS).

Flow: sign up → verify email → admin notified → admin approves on-site → user
emailed the result → approved user signs in to the gated `/admin` area.

---

## 0. Install the Supabase CLI (once)

```bash
npm install -g supabase   # or: brew install supabase/tap/supabase
supabase --version
```

---

## 1. Create the Supabase project

1. Sign in at https://supabase.com (GitHub login is fine) → **New project**.
2. Note the **Project URL**, **anon/public key**, and **service-role key** from
   **Project → Settings → API**. (You'll never put the service-role key in the app.)
3. The part of the URL before `.supabase.co` is your **project ref** (e.g. `abcd1234`).

## 2. Apply the database schema

**Option A — SQL Editor (simplest):** open **SQL Editor**, paste the contents of
[`supabase/migrations/0001_admin_auth.sql`](supabase/migrations/0001_admin_auth.sql),
and run it.

**Option B — CLI:**
```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

This creates `public.profiles`, RLS policies, the signup-lifecycle triggers, and
the `review_signup()` approval function.

## 3. Configure Auth

In **Authentication → Providers → Email**: enable **Confirm email**.

In **Authentication → URL Configuration**:
- **Site URL:** `https://<your-gh-username>.github.io/dcc-stats/`
- **Redirect URLs** (add both):
  - `https://<your-gh-username>.github.io/dcc-stats/`
  - `http://localhost:5173/`

(Optional) In **Authentication → Policies / Password**: set min length to 8 to
match the client-side rule.

## 4. Set up Brevo

1. Create an account at https://www.brevo.com.
2. **Senders, Domains & Dedicated IPs → Senders →** add `patil.govind@gmail.com`
   and click the verification link Brevo emails you. This becomes the "from".
3. **SMTP & API → SMTP tab:** note the **SMTP login** (looks like
   `xxxxxxx@smtp-brevo.com`) and the **SMTP key / master password**. → used in step 5.
4. **SMTP & API → API Keys tab:** create a **v3 API key**. → used in step 6
   (`BREVO_API_KEY`).

## 5. Point Supabase auth email at Brevo (custom SMTP)

In **Project → Settings → Authentication → SMTP Settings**, enable custom SMTP:

| Field | Value |
| --- | --- |
| Sender email | `patil.govind@gmail.com` (verified in step 4) |
| Sender name | `Dundalk Cricket Club` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | the Brevo **SMTP login** from step 4.3 |
| Password | the Brevo **SMTP key** from step 4.3 |

> This bypasses Supabase's built-in ~2-emails/hour cap. Without DKIM, Brevo sends
> via `@brevosend.com` — fine for low volume; add DKIM later for a branded address.

## 6. Deploy the Edge Functions + secrets

Generate a webhook secret and set all function secrets:
```bash
# from the repo root, after `supabase link` (step 2B)
WEBHOOK_SECRET=$(openssl rand -hex 32)

supabase secrets set \
  BREVO_API_KEY='<your Brevo v3 API key>' \
  BREVO_SENDER_EMAIL='patil.govind@gmail.com' \
  BREVO_SENDER_NAME='Dundalk Cricket Club' \
  ADMIN_EMAIL='patil.govind@gmail.com' \
  SITE_URL='https://<your-gh-username>.github.io/dcc-stats/' \
  WEBHOOK_SECRET="$WEBHOOK_SECRET"

echo "WEBHOOK_SECRET = $WEBHOOK_SECRET"   # copy this for step 7

supabase functions deploy notify-admin
supabase functions deploy notify-user
```

The function URLs are `https://<ref>.supabase.co/functions/v1/notify-admin` and
`.../notify-user`.

## 7. Create the Database Webhooks

In **Database → Webhooks**, create **two** webhooks. For each: table
`public.profiles`, event **Update**, type **Supabase Edge Functions** (pick the
function), and under **HTTP Headers** add:

```
x-webhook-secret: <the WEBHOOK_SECRET from step 6>
```

| Webhook | Calls |
| --- | --- |
| `notify-admin` | the `notify-admin` function |
| `notify-user` | the `notify-user` function |

(Each function checks the row's status, so it's safe for both to fire on any update.)

## 8. Wire up the frontend env

**Local dev:**
```bash
cp .env.example .env.local
# edit .env.local → VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

**Production:** GitHub repo → **Settings → Secrets and variables → Actions →**
add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
(the deploy workflow already reads them).

## 9. Seed yourself as superadmin (once)

The first superadmin can't be approved through the UI (no superadmin exists yet),
so bootstrap manually:

1. Run the app, sign up as `patil.govind@gmail.com`, and click the email
   confirmation link.
2. In the Supabase **SQL Editor**, run:
   ```sql
   update public.profiles
     set role = 'superadmin', status = 'approved'
     where email = 'patil.govind@gmail.com';
   ```
3. Sign in — you now see **Review signups** in the admin nav.

---

## 10. Test the full flow

Run locally: `npm run dev`, then open `http://localhost:5173/?feat=admin`
(the `?feat=admin` flag reveals the **Sign in** entry — see "Going live" below).

1. **Sign up** a second test user → confirmation email arrives.
2. **Confirm** → in Supabase, `profiles.status` becomes `pending_approval`.
3. The **admin email** arrives at `patil.govind@gmail.com` with a review link.
   (If not: check **Edge Functions → Logs** and **Database → Webhooks** delivery
   logs, and **Brevo → Transactional → Logs**.)
4. Open the link, sign in as superadmin, **Approve** → user gets a success email
   and `status=approved, role=admin`. Try a third user and **Reject**.
5. Sign in as the approved user → the `/admin` pages render. A pending/rejected
   user is blocked with the matching notice.

---

## 11. Going live

The header **Sign in** entry is shown to everyone by default (the earlier
`?feat=admin` gate has been removed). It goes live the next time `main` is
deployed. RLS and the route guards protect everything, so the routes are safe to
expose.

## Security notes

- The anon key is public by design; every table is RLS-guarded and clients have
  **no** write access to `profiles`.
- Approvals run through the `review_signup` SECURITY DEFINER function, which checks
  `is_superadmin()` — a tampered client cannot self-approve.
- The service-role key and all Brevo credentials live only in Supabase
  (Auth SMTP settings + Edge Function secrets), never in the bundle.
- Edge Functions authenticate webhook calls via the `WEBHOOK_SECRET` header.
