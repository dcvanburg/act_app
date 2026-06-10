-- Add creation date to barriers (for same-day edit rules as plan actions).

alter table public.waarde_barriers
  add column if not exists aangemaakt_op date;

update public.waarde_barriers
set aangemaakt_op = created_at::date
where aangemaakt_op is null;
