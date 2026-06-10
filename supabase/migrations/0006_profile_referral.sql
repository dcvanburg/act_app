-- Add referral_source to profiles so onboarding can record how the user
-- heard about the app. Nullable — existing rows stay valid.
alter table public.profiles
  add column if not exists referral_source text;
