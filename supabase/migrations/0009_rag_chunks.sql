-- ── RAG chatbot schema (ADR-005) ─────────────────────────────────────────────
--
-- Tables and search function for the Hybrid RAG chatbot. Therapist-approved
-- content is ingested by a service-role script into `documents` and `chunks`;
-- the user-facing `/search` Edge Function reads via the hybrid_search() RPC
-- using the user's JWT.
--
-- Embedding dimension is locked to 512 (Voyage AI voyage-3-lite, decided in
-- ADR-005 / OPEN_QUESTIONS #19). Changing this requires a new migration plus
-- a full re-ingest; pgvector HNSW indexes cannot be resized.
--
-- AVG / Article 9 notice (docs/SECURITY.md → AI processing):
--   • `chat_sessions` stores a counter only — never message bodies.
--   • `documents` and `chunks` hold therapist content, not user data, so they
--     are readable by all authenticated users.
--   • Writes to `documents` / `chunks` happen via the service role only (no
--     anon / authenticated policy granted). Service role bypasses RLS.

create extension if not exists vector;

-- ── documents ───────────────────────────────────────────────────────────────
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  source      text,
  category    text,
  phase       integer,
  created_at  timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "Authenticated users can read documents" on public.documents;
create policy "Authenticated users can read documents"
  on public.documents for select
  to authenticated
  using (true);

-- No insert / update / delete policy — ingest is service-role only.

-- ── chunks ──────────────────────────────────────────────────────────────────
create table if not exists public.chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents(id) on delete cascade,
  content      text not null,
  chunk_index  integer not null,
  embedding    vector(512),
  fts          tsvector generated always as (to_tsvector('dutch', content)) stored,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

alter table public.chunks enable row level security;

drop policy if exists "Authenticated users can read chunks" on public.chunks;
create policy "Authenticated users can read chunks"
  on public.chunks for select
  to authenticated
  using (true);

-- No insert / update / delete policy — ingest is service-role only.

create index if not exists idx_chunks_document_id on public.chunks(document_id);
create index if not exists idx_chunks_metadata on public.chunks using gin(metadata);
create index if not exists idx_chunks_fts on public.chunks using gin(fts);
create index if not exists idx_chunks_embedding on public.chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ── hybrid_search() ─────────────────────────────────────────────────────────
-- Combines vector similarity (pgvector cosine) and Dutch full-text search
-- (tsvector) via Reciprocal Rank Fusion. RRF score for a chunk that appears
-- in both rankings:
--
--   rrf_score = 1/(k + vector_rank) + 1/(k + fts_rank)
--
-- with k=60 (Cormack et al., 2009 — the de facto RRF default). plainto_tsquery
-- is used instead of to_tsquery so user punctuation (?, !, :, ...) does not
-- crash the function.

create or replace function public.hybrid_search(
  query_text       text,
  query_embedding  vector(512),
  match_count      int     default 5,
  rrf_k            int     default 60,
  filter_category  text    default null,
  filter_phase     integer default null
)
returns table (
  id           uuid,
  document_id  uuid,
  content      text,
  metadata     jsonb,
  rrf_score    double precision,
  vector_rank  bigint,
  fts_rank     bigint
)
language sql
stable
as $$
  with
  vector_results as (
    select
      c.id,
      c.document_id,
      c.content,
      c.metadata,
      row_number() over (order by c.embedding <=> query_embedding) as rank
    from public.chunks c
    join public.documents d on d.id = c.document_id
    where c.embedding is not null
      and (filter_category is null or d.category = filter_category)
      and (filter_phase is null or d.phase = filter_phase)
    order by c.embedding <=> query_embedding
    limit match_count * 2
  ),
  fts_results as (
    select
      c.id,
      c.document_id,
      c.content,
      c.metadata,
      row_number() over (
        order by ts_rank_cd(c.fts, plainto_tsquery('dutch', query_text)) desc
      ) as rank
    from public.chunks c
    join public.documents d on d.id = c.document_id
    where c.fts @@ plainto_tsquery('dutch', query_text)
      and (filter_category is null or d.category = filter_category)
      and (filter_phase is null or d.phase = filter_phase)
    order by ts_rank_cd(c.fts, plainto_tsquery('dutch', query_text)) desc
    limit match_count * 2
  ),
  fused as (
    select
      coalesce(v.id, f.id)                   as id,
      coalesce(v.document_id, f.document_id) as document_id,
      coalesce(v.content, f.content)         as content,
      coalesce(v.metadata, f.metadata)       as metadata,
      coalesce(1.0 / (rrf_k + v.rank), 0)
        + coalesce(1.0 / (rrf_k + f.rank), 0)
                                             as rrf_score,
      v.rank                                 as vector_rank,
      f.rank                                 as fts_rank
    from vector_results v
    full outer join fts_results f on f.id = v.id
  )
  select id, document_id, content, metadata, rrf_score, vector_rank, fts_rank
  from fused
  order by rrf_score desc
  limit match_count;
$$;

grant execute on function public.hybrid_search(
  text, vector(512), int, int, text, integer
) to authenticated;

-- ── chat_sessions (Article 9 — counter only, no message bodies) ─────────────
create table if not exists public.chat_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  message_count  integer not null default 0
);

alter table public.chat_sessions enable row level security;

drop policy if exists "Users can view own chat sessions" on public.chat_sessions;
create policy "Users can view own chat sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat sessions" on public.chat_sessions;
create policy "Users can insert own chat sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own chat sessions" on public.chat_sessions;
create policy "Users can update own chat sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy — sessions are not user-deletable individually. The account
-- delete cascade (docs/SECURITY.md → Account deletion) removes them with the
-- profiles row.

create index if not exists idx_chat_sessions_user_started
  on public.chat_sessions(user_id, started_at desc);
