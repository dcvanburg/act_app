-- ── Waarden (values tracker) ─────────────────────────────────────────────────
--
-- User-defined values, plan actions, barriers, and daily check-ins.
-- Article 9 (AVG): reflective mental-health data — RLS on auth.uid(), cascade
-- delete via profiles FK.

create table if not exists public.waarden (
  id            text primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  naam          text not null,
  beschrijving  text not null default '',
  kleur         text not null,
  created_at    timestamptz not null default now()
);

create table if not exists public.waarde_acties (
  id            text primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  waarde_id     text not null references public.waarden(id) on delete cascade,
  termijn       text not null check (termijn in ('kort', 'middel', 'lang')),
  actie         text not null,
  aangemaakt_op date not null,
  beoordeling   jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists public.waarde_barriers (
  id            text primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  waarde_id     text not null references public.waarden(id) on delete cascade,
  type          text not null check (type in ('vermijding', 'gedachte', 'zelfkritiek', 'eigen')),
  eigen_label   text,
  omschrijving  text not null,
  created_at    timestamptz not null default now()
);

create table if not exists public.waarde_checkins (
  id         text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  waarde_id  text not null references public.waarden(id) on delete cascade,
  datum      date not null,
  antwoord   text not null check (antwoord in ('ja', 'neutraal', 'nee')),
  notitie    text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists idx_waarde_checkins_user_waarde_datum
  on public.waarde_checkins(user_id, waarde_id, datum);

create index if not exists idx_waarden_user on public.waarden(user_id);
create index if not exists idx_waarde_acties_user_waarde on public.waarde_acties(user_id, waarde_id);
create index if not exists idx_waarde_barriers_user_waarde on public.waarde_barriers(user_id, waarde_id);
create index if not exists idx_waarde_checkins_user_datum on public.waarde_checkins(user_id, datum desc);

alter table public.waarden enable row level security;
alter table public.waarde_acties enable row level security;
alter table public.waarde_barriers enable row level security;
alter table public.waarde_checkins enable row level security;

-- waarden
drop policy if exists "Users can view own waarden" on public.waarden;
create policy "Users can view own waarden"
  on public.waarden for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own waarden" on public.waarden;
create policy "Users can insert own waarden"
  on public.waarden for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own waarden" on public.waarden;
create policy "Users can update own waarden"
  on public.waarden for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own waarden" on public.waarden;
create policy "Users can delete own waarden"
  on public.waarden for delete using (auth.uid() = user_id);

-- waarde_acties
drop policy if exists "Users can view own waarde acties" on public.waarde_acties;
create policy "Users can view own waarde acties"
  on public.waarde_acties for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own waarde acties" on public.waarde_acties;
create policy "Users can insert own waarde acties"
  on public.waarde_acties for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own waarde acties" on public.waarde_acties;
create policy "Users can update own waarde acties"
  on public.waarde_acties for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own waarde acties" on public.waarde_acties;
create policy "Users can delete own waarde acties"
  on public.waarde_acties for delete using (auth.uid() = user_id);

-- waarde_barriers
drop policy if exists "Users can view own waarde barriers" on public.waarde_barriers;
create policy "Users can view own waarde barriers"
  on public.waarde_barriers for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own waarde barriers" on public.waarde_barriers;
create policy "Users can insert own waarde barriers"
  on public.waarde_barriers for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own waarde barriers" on public.waarde_barriers;
create policy "Users can delete own waarde barriers"
  on public.waarde_barriers for delete using (auth.uid() = user_id);

-- waarde_checkins
drop policy if exists "Users can view own waarde checkins" on public.waarde_checkins;
create policy "Users can view own waarde checkins"
  on public.waarde_checkins for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own waarde checkins" on public.waarde_checkins;
create policy "Users can insert own waarde checkins"
  on public.waarde_checkins for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own waarde checkins" on public.waarde_checkins;
create policy "Users can update own waarde checkins"
  on public.waarde_checkins for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own waarde checkins" on public.waarde_checkins;
create policy "Users can delete own waarde checkins"
  on public.waarde_checkins for delete using (auth.uid() = user_id);
