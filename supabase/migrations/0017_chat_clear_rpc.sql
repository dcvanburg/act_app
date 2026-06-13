-- ── Reliable "wis huidige chat" via RPC + policy repair ─────────────────────
-- Client-side multi-step clear could fail when UPDATE on chat_sessions was
-- blocked or duplicate active sessions existed. This function runs atomically.

drop policy if exists "Users can update own chat sessions" on public.chat_sessions;
create policy "Users can update own chat sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own chat sessions" on public.chat_sessions;
create policy "Users can delete own chat sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

create or replace function public.clear_current_chat_session()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sid uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.chat_messages
  where user_id = uid
    and session_id in (
      select id from public.chat_sessions
      where user_id = uid and ended_at is null
    );

  delete from public.chat_sessions
  where user_id = uid and ended_at is null;

  insert into public.chat_sessions (user_id)
  values (uid)
  returning id into sid;

  return sid;
end;
$$;

revoke all on function public.clear_current_chat_session() from public;
grant execute on function public.clear_current_chat_session() to authenticated;
