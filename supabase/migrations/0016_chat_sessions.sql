-- ── Chat sessions: separate current conversation from full history ───────────
-- One active session per user (ended_at IS NULL). Messages belong to a session.
-- "Wis huidige chat" ends the active session; "Wis alles" removes all sessions.

alter table public.chat_sessions
  add column if not exists ended_at timestamptz;

alter table public.chat_messages
  add column if not exists session_id uuid references public.chat_sessions(id) on delete cascade;

-- Backfill: one active session per user who already has messages.
do $$
declare
  r record;
  sid uuid;
begin
  for r in
    select distinct user_id
    from public.chat_messages
    where session_id is null
  loop
    insert into public.chat_sessions (user_id, message_count, ended_at)
    values (
      r.user_id,
      (select count(*)::int from public.chat_messages where user_id = r.user_id),
      null
    )
    returning id into sid;

    update public.chat_messages
    set session_id = sid
    where user_id = r.user_id
      and session_id is null;
  end loop;
end $$;

alter table public.chat_messages
  alter column session_id set not null;

create unique index if not exists idx_chat_sessions_active_per_user
  on public.chat_sessions (user_id)
  where ended_at is null;

create index if not exists idx_chat_messages_session_created
  on public.chat_messages (session_id, created_at asc);

drop policy if exists "Users can delete own chat sessions" on public.chat_sessions;
create policy "Users can delete own chat sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);
