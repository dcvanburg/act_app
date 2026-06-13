-- Waarden tracker: shared plan, barriers, and daily check-in at collection level.
-- waarde_id NULL = applies to the user's selected waarden set (not one waarde).

alter table public.waarde_acties alter column waarde_id drop not null;
alter table public.waarde_barriers alter column waarde_id drop not null;
alter table public.waarde_checkins alter column waarde_id drop not null;

update public.waarde_acties set waarde_id = null;
update public.waarde_barriers set waarde_id = null;

-- Keep the latest check-in per user per calendar day; drop older duplicates.
delete from public.waarde_checkins a
using public.waarde_checkins b
where a.user_id = b.user_id
  and a.datum = b.datum
  and a.created_at < b.created_at;

update public.waarde_checkins set waarde_id = null;

drop index if exists public.idx_waarde_checkins_user_waarde_datum;

create unique index if not exists idx_waarde_checkins_collection_daily
  on public.waarde_checkins(user_id, datum)
  where waarde_id is null;
