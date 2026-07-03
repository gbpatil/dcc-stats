-- ============================================================================
-- DCC-Stats — Admin panel schema
-- Email-verified, admin-approved signup with role-based access.
--
-- Idempotent: safe to run on a fresh project via the SQL Editor or
-- `supabase db push`. All privilege changes are server-enforced; clients have
-- NO write access to profiles (only SECURITY DEFINER functions mutate them).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles — one row per auth user, holding signup details + approval state.
--    status/role use text + CHECK (no pg enums to avoid migration friction).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  full_name     text,
  phone         text,
  signup_reason text,
  status        text not null default 'pending_email'
                  check (status in ('pending_email', 'pending_approval', 'approved', 'rejected')),
  role          text not null default 'member'
                  check (role in ('member', 'admin', 'superadmin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid references auth.users (id)
);

comment on table public.profiles is
  'Application profile + signup approval lifecycle for each auth user.';

create index if not exists profiles_status_idx on public.profiles (status);

-- Keep updated_at current on every change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. is_superadmin() — SECURITY DEFINER so RLS policies can call it without
--    recursing into profiles' own policies.
-- ----------------------------------------------------------------------------
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

revoke all on function public.is_superadmin() from public;
grant execute on function public.is_superadmin() to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Row Level Security — read-only for clients; NO client writes at all.
--    Inserts come from the auth.users trigger; status/role changes from the
--    review_signup() RPC; deletes cascade from auth.users.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_select_superadmin on public.profiles;
create policy profiles_select_superadmin
  on public.profiles for select
  to authenticated
  using (public.is_superadmin());

-- ----------------------------------------------------------------------------
-- 4. handle_new_user() — create a profile row when someone signs up.
--    Reads optional signup details from auth metadata.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, signup_reason, status)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'signup_reason', ''),
    case when new.email_confirmed_at is null then 'pending_email' else 'pending_approval' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. handle_email_confirmed() — advance to 'pending_approval' once the user
--    verifies their email. A Database Webhook on profiles UPDATE then notifies
--    the admin (see SETUP).
-- ----------------------------------------------------------------------------
create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles
      set status = 'pending_approval'
      where id = new.id and status = 'pending_email';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_email_confirmed();

-- ----------------------------------------------------------------------------
-- 6. review_signup() — approve/reject a pending signup. Superadmin-only and
--    idempotent (acts only on rows still 'pending_approval'). A Database
--    Webhook on the resulting UPDATE notifies the user of the decision.
-- ----------------------------------------------------------------------------
create or replace function public.review_signup(target_id uuid, decision text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
begin
  if not public.is_superadmin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if decision not in ('approve', 'reject') then
    raise exception 'invalid decision: %', decision using errcode = '22023';
  end if;

  update public.profiles
    set status      = case when decision = 'approve' then 'approved' else 'rejected' end,
        role        = case when decision = 'approve' then 'admin' else role end,
        reviewed_at = now(),
        reviewed_by = auth.uid()
    where id = target_id
      and status = 'pending_approval'
    returning * into result;

  if result.id is null then
    raise exception 'signup not found or not pending review' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

revoke all on function public.review_signup(uuid, text) from public;
grant execute on function public.review_signup(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 7. After first deploy, promote yourself to superadmin (run ONCE, manually):
--
--   update public.profiles
--     set role = 'superadmin', status = 'approved'
--     where email = 'patil.govind@gmail.com';
-- ----------------------------------------------------------------------------
