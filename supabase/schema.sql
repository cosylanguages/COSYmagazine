-- ==============================================================================
-- COSYmagazine • Supabase Database Schema & Storage Configuration
-- Synchronized with js/cms-auth.js, js/flipbook.js, editor.html, and COSYlanguages
-- ==============================================================================
--
-- Re-runnable: tables use IF NOT EXISTS, policies are dropped and recreated, and
-- the seed uses ON CONFLICT (volume_number, language).
--
-- After applying this file to an existing project, audit privileged profiles and
-- purchases created before the RLS fix:
--   select id, email, role from public.profiles where role in ('admin','founder','owner');
--   select * from public.issue_purchases;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLE: profiles
-- User profile & permission tier. Synchronized with CosyCMSAuth role checks.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'student' check (role in ('student', 'subscriber', 'teacher', 'admin', 'founder', 'owner')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Role helpers are SECURITY DEFINER so RLS policies can read profiles without
-- recursing through the profiles policies themselves.
create or replace function public.cosy_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.cosy_is_privileged()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'founder', 'owner') from public.profiles where id = auth.uid()),
    false
  )
$$;

-- Profiles RLS Policies
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Admins and Founders can view all profiles" on public.profiles;
create policy "Admins and Founders can view all profiles"
  on public.profiles for select
  using (public.cosy_is_privileged());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins and Founders can update any profile" on public.profiles;
create policy "Admins and Founders can update any profile"
  on public.profiles for update
  using (public.cosy_is_privileged())
  with check (public.cosy_is_privileged());

-- A user may edit their own name/avatar, but only privileged roles may change a role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.cosy_is_privileged() then
    raise exception 'Only admins can change profile roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Profiles Trigger: automatically insert profile on auth.users signup.
-- The role is always 'student'; never trust role metadata supplied at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. TABLE: subscriptions
-- Active recurring subscriptions granting access to all digital flipbooks & archives.
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tier text not null check (tier in ('free', 'monthly', 'annual', 'founder', 'patron')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  valid_until timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Founders and Admins can view all subscriptions" on public.subscriptions;
create policy "Founders and Admins can view all subscriptions"
  on public.subscriptions for select
  using (public.cosy_is_privileged());

drop policy if exists "Service role or Admins can modify subscriptions" on public.subscriptions;
create policy "Service role or Admins can modify subscriptions"
  on public.subscriptions for all
  using (public.cosy_is_privileged())
  with check (public.cosy_is_privileged());

-- 4. TABLE: issue_purchases
-- Individual one-off digital issue entitlements.
create table if not exists public.issue_purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  issue_id text not null, -- e.g. 'vol-2026-08', 'vol-2026-09'
  amount_paid integer,     -- in cents/pence (e.g. 499 = €4.99)
  currency text default 'eur',
  purchase_date timestamptz default now(),
  receipt_url text
);

alter table public.issue_purchases enable row level security;

drop policy if exists "Users can view their own issue purchases" on public.issue_purchases;
create policy "Users can view their own issue purchases"
  on public.issue_purchases for select
  using (auth.uid() = user_id);

drop policy if exists "Founders and Admins can view all issue purchases" on public.issue_purchases;
create policy "Founders and Admins can view all issue purchases"
  on public.issue_purchases for select
  using (public.cosy_is_privileged());

-- Purchases are written by the payment webhook with the service role.
-- Never let a user insert their own entitlement row.
drop policy if exists "Service role or Admins can insert purchases" on public.issue_purchases;
drop policy if exists "Admins can insert purchases" on public.issue_purchases;
create policy "Admins can insert purchases"
  on public.issue_purchases for insert
  with check (public.cosy_is_privileged());

-- 5. TABLE: magazine_issues
-- Magazine issue registry, metadata, preview limits, and secure PDF cloud storage pointers.
create table if not exists public.magazine_issues (
  id text primary key, -- canonical identifier, e.g. 'vol-2026-08-en'
  volume_number text not null, -- 'Vol. 2026.08'
  language text not null default 'en', -- 'en' | 'fr' | 'ru' — editions are sold separately
  title text not null, -- 'Get Ready for School'
  theme text,
  month_year text, -- 'August 2026'
  is_published boolean default false,
  preview_page_limit integer default 3,
  pdf_storage_path text, -- e.g. 'issues/cosymagazine-2026.08-en.pdf'
  created_at timestamptz default now()
);

-- Existing installations created before per-language editions: adopt the column
-- and keep current rows as the English edition.
alter table public.magazine_issues
  add column if not exists language text not null default 'en';

-- One row per volume per language. An index rather than an inline constraint so
-- the rule also reaches tables created before the column existed.
create unique index if not exists magazine_issues_volume_language_idx
  on public.magazine_issues (volume_number, language);

alter table public.magazine_issues enable row level security;

drop policy if exists "Public can view published issue catalog metadata" on public.magazine_issues;
create policy "Public can view published issue catalog metadata"
  on public.magazine_issues for select
  using (is_published = true or public.cosy_is_privileged());

drop policy if exists "Founders and Admins can manage magazine issues" on public.magazine_issues;
create policy "Founders and Admins can manage magazine issues"
  on public.magazine_issues for all
  using (public.cosy_is_privileged())
  with check (public.cosy_is_privileged());

-- True when the caller bought the issue whose exact PDF path is supplied.
-- Defined after magazine_issues exists so the SQL body validates on a fresh DB.
create or replace function public.cosy_owns_issue(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.issue_purchases p
    join public.magazine_issues i on i.id = p.issue_id
    where p.user_id = auth.uid()
      and i.pdf_storage_path = object_name
  )
$$;

-- 6. STORAGE BUCKET: magazine-editions
-- Private bucket for premium PDF downloads, speaking club handouts, and audio dispatches.
insert into storage.buckets (id, name, public)
values ('magazine-editions', 'magazine-editions', false)
on conflict (id) do update set public = false;

-- Storage Download Security Policy:
-- Authorized if:
--   1. User has founder / admin / owner role in profiles
--   2. User has an active subscription in subscriptions
--   3. User has purchased the issue (matching issue_id in storage file path)
drop policy if exists "Paid subscribers and issue owners can access magazine PDFs" on storage.objects;
create policy "Paid subscribers and issue owners can access magazine PDFs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'magazine-editions'
    and (
      -- 1. Founder / admin check
      public.cosy_is_privileged()
      -- 2. Active subscription check
      or exists (
        select 1 from public.subscriptions
        where user_id = auth.uid()
          and status = 'active'
          and (valid_until is null or valid_until > now())
      )
      -- 3. Purchased individual issue check, matched against the exact stored path
      or public.cosy_owns_issue(storage.objects.name)
    )
  );

-- Storage Upload Policy: restricted to founders/admins
drop policy if exists "Only Founders and Admins can upload to magazine-editions" on storage.objects;
create policy "Only Founders and Admins can upload to magazine-editions"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'magazine-editions'
    and public.cosy_is_privileged()
  );

-- 7. CMS STAGING TABLES: editor.html
-- These are a database staging area only. The static build reads
-- content/**/posts/*.json; download the JSON and commit it to ship a change.
create table if not exists public.magazine_article_overrides (
  slug text primary key,
  post_data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.magazine_article_overrides enable row level security;

drop policy if exists "Founders and Admins can manage article overrides" on public.magazine_article_overrides;
create policy "Founders and Admins can manage article overrides"
  on public.magazine_article_overrides for all
  using (public.cosy_is_privileged())
  with check (public.cosy_is_privileged());

create table if not exists public.cms_page_overrides (
  page_path text primary key,
  overrides jsonb not null,
  updated_at timestamptz default now()
);

alter table public.cms_page_overrides enable row level security;

drop policy if exists "Founders and Admins can manage page overrides" on public.cms_page_overrides;
create policy "Founders and Admins can manage page overrides"
  on public.cms_page_overrides for all
  using (public.cosy_is_privileged())
  with check (public.cosy_is_privileged());

-- 8. INITIAL SEED DATA: Magazine Issues Arc
insert into public.magazine_issues (id, volume_number, language, title, theme, month_year, is_published, preview_page_limit, pdf_storage_path)
values
  ('vol-2026-08', 'Vol. 2026.08', 'en', 'Get Ready for School', 'Foundations, Fresh Beginnings, Pedagogy & Early Acquisition', 'August 2026', true, 3, 'issues/cosymagazine-vol-2026-08.pdf'),
  ('vol-2026-09', 'Vol. 2026.09', 'en', 'Me vs Intermediate Plateau', 'The B1-B2 Plateau, Persistence, Nuance & True Voice', 'September 2026', true, 3, 'issues/cosymagazine-vol-2026-09.pdf'),
  ('vol-2026-10', 'Vol. 2026.10', 'en', 'JY DM''s Birthday & His Favs', 'Playfulness, Agility, Overcoming Freezing & Tangents', 'October 2026', true, 3, 'issues/cosymagazine-vol-2026-10.pdf'),
  ('vol-2026-11', 'Vol. 2026.11', 'en', 'November Academia', 'Cognitive Linguistics, Neuroplasticity & Creative Storytelling', 'November 2026', true, 3, 'issues/cosymagazine-vol-2026-11.pdf'),
  ('vol-2026-12', 'Vol. 2026.12', 'en', 'Winter Grammar & High Frequency Verbs', 'Warmth, Seasonal Rhythms, Phrasal Logic & Introspective Living', 'December 2026', true, 3, 'issues/cosymagazine-vol-2026-12.pdf'),
  ('vol-2027-01', 'Vol. 2027.01', 'en', 'Fresh Slates & Rebirth', 'Identity, Habit Formation & The Tabula Rasa', 'January 2027', false, 3, 'issues/cosymagazine-vol-2027-01.pdf'),
  ('vol-2027-02', 'Vol. 2027.02', 'en', 'February Grammar & High Frequency Verbs', 'Connection, Romance, Financial Nuance & Emotional Vulnerability', 'February 2027', false, 3, 'issues/cosymagazine-vol-2027-02.pdf')
on conflict (volume_number, language) do update set
  title = excluded.title,
  theme = excluded.theme,
  month_year = excluded.month_year,
  is_published = excluded.is_published,
  preview_page_limit = excluded.preview_page_limit,
  pdf_storage_path = excluded.pdf_storage_path;
