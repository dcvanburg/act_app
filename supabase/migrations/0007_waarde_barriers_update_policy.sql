-- Fix: waarde_barriers was missing an UPDATE RLS policy.
-- Without this, updateBarriereRemote silently fails (RLS blocks the write,
-- Supabase returns no error but affects 0 rows).

drop policy if exists "Users can update own waarde barriers" on public.waarde_barriers;
create policy "Users can update own waarde barriers"
  on public.waarde_barriers
  for update
  using (auth.uid() = user_id);
