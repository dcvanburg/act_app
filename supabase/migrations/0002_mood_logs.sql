-- ── γ-1 mood tracker ─────────────────────────────────────────────────────────
--
-- Daily mood + emotion tags + optional note. Article 9 (AVG): mental-health
-- data, RLS keyed on auth.uid(), ON DELETE CASCADE off profiles so the α6
-- GDPR account-delete wipes it.
--
-- Append-only: no UPDATE policy. Users can DELETE individual entries (regret /
-- typo recovery) but cannot rewrite history in place — useful for clinical
-- interpretation later if a clinician dashboard is added.

create table if not exists public.mood_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  date          date not null,
  mood_score    smallint not null check (mood_score between 1 and 5),
  emotion_tags  text[] not null default '{}',
  note          text,
  created_at    timestamptz not null default now()
);

alter table public.mood_logs enable row level security;

drop policy if exists "Users can view own mood logs" on public.mood_logs;
create policy "Users can view own mood logs"
  on public.mood_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own mood logs" on public.mood_logs;
create policy "Users can insert own mood logs"
  on public.mood_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own mood logs" on public.mood_logs;
create policy "Users can delete own mood logs"
  on public.mood_logs for delete
  using (auth.uid() = user_id);

-- No UPDATE policy — intentional. See header.

create index if not exists idx_mood_logs_user_date
  on public.mood_logs(user_id, date desc);
