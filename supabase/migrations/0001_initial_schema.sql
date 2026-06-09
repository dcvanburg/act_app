-- ── Initial schema for the Expo app ──────────────────────────────────────────
--
-- Matches what the pre-pivot Next.js app already populated in the existing
-- Supabase project (atscybinltwlaaucthsl). Re-runnable: every CREATE uses
-- IF NOT EXISTS so it is safe to apply on the existing project.
--
-- RLS is enabled on every table that holds user data. Crisis content lives in
-- the app bundle (src/content/nl/crisis.json), never in the database.
--
-- AVG / GDPR Article 9 notice: journal_entries (and later mood_logs, exercise
-- logs, weekly check-ins) hold mental-health data. They are subject to the
-- minimum-collection rule and to the in-app account-deletion cascade. See
-- docs/SECURITY.md.

create extension if not exists pgcrypto;

-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                 uuid primary key references auth.users on delete cascade,
  email              text,
  first_name         text,
  last_name          text,
  phone              text,
  subscription_tier  text default 'free',
  created_at         timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── user_progress (single row per user; UserProgress JSON shape) ─────────────
create table if not exists public.user_progress (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  progress    jsonb not null default '{}',
  updated_at  timestamptz default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "Users can view own progress" on public.user_progress;
create policy "Users can view own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on public.user_progress;
create policy "Users can insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own progress" on public.user_progress;
create policy "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

-- ── journal_entries (Article 9 — health data) ────────────────────────────────
create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz default now()
);

alter table public.journal_entries enable row level security;

drop policy if exists "Users can view own journal entries" on public.journal_entries;
create policy "Users can view own journal entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own journal entries" on public.journal_entries;
create policy "Users can insert own journal entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own journal entries" on public.journal_entries;
create policy "Users can update own journal entries"
  on public.journal_entries for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own journal entries" on public.journal_entries;
create policy "Users can delete own journal entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

create index if not exists idx_journal_entries_user_created
  on public.journal_entries(user_id, created_at desc);
