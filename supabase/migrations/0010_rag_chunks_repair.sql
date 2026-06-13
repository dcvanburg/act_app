-- Repair pre-release RAG schema (source/phase int) → ADR-005 target schema.
-- Safe when tables are empty; drops legacy documents/chunks and recreates.

drop table if exists public.chunks cascade;
drop table if exists public.documents cascade;

create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  source_path   text not null unique,
  title         text not null,
  category      text not null check (category in ('module', 'daily-practice', 'intake', 'exercise')),
  phase         text,
  module_number int,
  created_at    timestamptz not null default now()
);

create table public.chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content     text not null,
  embedding   vector(512),
  metadata    jsonb not null default '{}'::jsonb,
  fts         tsvector generated always as (to_tsvector('dutch', content)) stored,
  created_at  timestamptz not null default now()
);

create index idx_chunks_document on public.chunks(document_id);
create index idx_chunks_fts on public.chunks using gin (fts);
create index idx_chunks_embedding on public.chunks
  using hnsw (embedding vector_cosine_ops);

create or replace function public.hybrid_search(
  query_text text,
  query_embedding vector(512),
  match_count int default 5,
  filter_category text default null,
  filter_phase int default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  rrf_score double precision
)
language sql
stable
security invoker
as $$
  with vector_search as (
    select
      c.id,
      c.document_id,
      c.content,
      c.metadata,
      row_number() over (order by c.embedding <=> query_embedding) as rank_ix
    from public.chunks c
    join public.documents d on d.id = c.document_id
    where c.embedding is not null
      and (filter_category is null or d.category = filter_category)
      and (filter_phase is null or d.module_number = filter_phase)
    limit greatest(match_count * 4, 20)
  ),
  fts_search as (
    select
      c.id,
      c.document_id,
      c.content,
      c.metadata,
      row_number() over (
        order by ts_rank_cd(c.fts, websearch_to_tsquery('dutch', query_text)) desc
      ) as rank_ix
    from public.chunks c
    join public.documents d on d.id = c.document_id
    where c.fts @@ websearch_to_tsquery('dutch', query_text)
      and (filter_category is null or d.category = filter_category)
      and (filter_phase is null or d.module_number = filter_phase)
    limit greatest(match_count * 4, 20)
  ),
  rrf_scores as (
    select
      coalesce(v.id, f.id) as id,
      coalesce(v.document_id, f.document_id) as document_id,
      coalesce(v.content, f.content) as content,
      coalesce(v.metadata, f.metadata) as metadata,
      coalesce(1.0 / (60.0 + v.rank_ix), 0.0) + coalesce(1.0 / (60.0 + f.rank_ix), 0.0) as rrf_score
    from vector_search v
    full outer join fts_search f on v.id = f.id
  )
  select r.id, r.document_id, r.content, r.metadata, r.rrf_score
  from rrf_scores r
  order by r.rrf_score desc
  limit match_count;
$$;

grant execute on function public.hybrid_search(text, vector(512), int, text, int)
  to authenticated, service_role;

alter table public.documents enable row level security;
alter table public.chunks enable row level security;

drop policy if exists "Authenticated users can read documents" on public.documents;
create policy "Authenticated users can read documents"
  on public.documents for select to authenticated
  using (true);

drop policy if exists "Authenticated users can read chunks" on public.chunks;
create policy "Authenticated users can read chunks"
  on public.chunks for select to authenticated
  using (true);
