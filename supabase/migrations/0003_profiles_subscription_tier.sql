-- ── α6 account screen ────────────────────────────────────────────────────────
--
-- The pre-pivot Supabase project created `profiles` without `subscription_tier`.
-- The Expo account screen selects this column on load and after save; PostgREST
-- returns 42703 when the column is missing, which surfaces as "Opslaan mislukt".

alter table public.profiles
  add column if not exists subscription_tier text default 'free';
