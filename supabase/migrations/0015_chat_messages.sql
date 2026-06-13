-- ── Chat message persistence (ADR-005 update 2026-06-13) ─────────────────────
-- Stores user ↔ assistant message bodies for conversation memory in the RAG
-- chatbot. Article 9 data — RLS scoped to owner; cascade delete on profile.

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_user_created
  on public.chat_messages(user_id, created_at asc);

alter table public.chat_messages enable row level security;

drop policy if exists "Users can view own chat messages" on public.chat_messages;
create policy "Users can view own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat messages" on public.chat_messages;
create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own chat messages" on public.chat_messages;
create policy "Users can delete own chat messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);
