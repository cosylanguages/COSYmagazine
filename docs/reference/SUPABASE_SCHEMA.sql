-- ==============================================================================
-- COSYmagazine • Supabase Database Schema & Storage Configuration
-- Synchronized with js/cms-auth.js, js/flipbook.js, editor.html, and COSYlanguages
-- ==============================================================================

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

-- Profiles RLS Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins and Founders can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'founder', 'owner')
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins and Founders can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'founder', 'owner')
    )
  );

-- Profiles Trigger: automatically insert profile on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

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

create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Founders and Admins can view all subscriptions"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'founder', 'owner')
    )
  );

create policy "Service role or Admins can modify subscriptions"
  on public.subscriptions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'founder', 'owner')
    )
  );

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

create policy "Users can view their own issue purchases"
  on public.issue_purchases for select
  using (auth.uid() = user_id);

create policy "Founders and Admins can view all issue purchases"
  on public.issue_purchases for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'founder', 'owner')
    )
  );

create policy "Service role or Admins can insert purchases"
  on public.issue_purchases for insert
  with check (
    auth.uid() = user_id or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'founder', 'owner')
    )
  );

-- 5. TABLE: magazine_issues
-- Magazine issue registry, metadata, preview limits, and secure PDF cloud storage pointers.
create table if not exists public.magazine_issues (
  id text primary key, -- canonical identifier, e.g. 'vol-2026-08'
  volume_number text not null, -- 'Vol. 2026.08'
  title text not null, -- 'Get Ready for School'
  theme text,
  month_year text, -- 'August 2026'
  is_published boolean default false,
  preview_page_limit integer default 3,
  pdf_storage_path text, -- e.g. 'issues/cosymagazine-vol-2026-08.pdf'
  created_at timestamptz default now()
);

alter table public.magazine_issues enable row level security;

create policy "Public can view published issue catalog metadata"
  on public.magazine_issues for select
  using (
    is_published = true or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'founder', 'owner')
    )
  );

create policy "Founders and Admins can manage magazine issues"
  on public.magazine_issues for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'founder', 'owner')
    )
  );

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
create policy "Paid subscribers and issue owners can access magazine PDFs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'magazine-editions'
    and (
      -- 1. Founder / admin check
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'founder', 'owner')
      )
      -- 2. Active subscription check
      or exists (
        select 1 from public.subscriptions
        where user_id = auth.uid()
          and status = 'active'
          and (valid_until is null or valid_until > now())
      )
      -- 3. Purchased individual issue check
      or exists (
        select 1 from public.issue_purchases
        where user_id = auth.uid()
          and storage.objects.name like '%' || issue_purchases.issue_id || '%'
      )
    )
  );

-- Storage Upload Policy: restricted to founders/admins
create policy "Only Founders and Admins can upload to magazine-editions"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'magazine-editions'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'founder', 'owner')
    )
  );

-- 7. INITIAL SEED DATA: Magazine Issues Arc
insert into public.magazine_issues (id, volume_number, title, theme, month_year, is_published, preview_page_limit, pdf_storage_path)
values
  ('vol-2026-08', 'Vol. 2026.08', 'Get Ready for School', 'Foundations, Fresh Beginnings, Pedagogy & Early Acquisition', 'August 2026', true, 3, 'issues/cosymagazine-vol-2026-08.pdf'),
  ('vol-2026-09', 'Vol. 2026.09', 'Me vs Intermediate Plateau', 'The B1-B2 Plateau, Persistence, Nuance & True Voice', 'September 2026', true, 3, 'issues/cosymagazine-vol-2026-09.pdf'),
  ('vol-2026-10', 'Vol. 2026.10', 'JY DM''s Birthday & His Favs', 'Playfulness, Agility, Overcoming Freezing & Tangents', 'October 2026', true, 3, 'issues/cosymagazine-vol-2026-10.pdf'),
  ('vol-2026-11', 'Vol. 2026.11', 'November Academia', 'Cognitive Linguistics, Neuroplasticity & Creative Storytelling', 'November 2026', true, 3, 'issues/cosymagazine-vol-2026-11.pdf'),
  ('vol-2026-12', 'Vol. 2026.12', 'Winter Grammar & High Frequency Verbs', 'Warmth, Seasonal Rhythms, Phrasal Logic & Introspective Living', 'December 2026', true, 3, 'issues/cosymagazine-vol-2026-12.pdf'),
  ('vol-2027-01', 'Vol. 2027.01', 'Fresh Slates & Rebirth', 'Identity, Habit Formation & The Tabula Rasa', 'January 2027', false, 3, 'issues/cosymagazine-vol-2027-01.pdf'),
  ('vol-2027-02', 'Vol. 2027.02', 'February Grammar & High Frequency Verbs', 'Connection, Romance, Financial Nuance & Emotional Vulnerability', 'February 2027', false, 3, 'issues/cosymagazine-vol-2027-02.pdf')
on conflict (id) do update set
  volume_number = excluded.volume_number,
  title = excluded.title,
  theme = excluded.theme,
  month_year = excluded.month_year,
  is_published = excluded.is_published,
  preview_page_limit = excluded.preview_page_limit,
  pdf_storage_path = excluded.pdf_storage_path;
