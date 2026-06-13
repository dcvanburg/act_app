-- Upgrade RAG embeddings from voyage-3-lite (512 d) to voyage-3 (1024 d).
-- Drops chunks (re-ingested with the new model; documents row stays).
-- The hybrid_search signature changes too, so we drop the old overload.

drop function if exists public.hybrid_search(text, vector(512), int, text, int);
drop function if exists public.hybrid_search(text, vector, int, text, int);

truncate table public.chunks;

alter table public.chunks
  alter column embedding type vector(1024);

-- Recreate the HNSW index against the new dimension.
drop index if exists public.idx_chunks_embedding;
create index idx_chunks_embedding on public.chunks
  using hnsw (embedding vector_cosine_ops);

create or replace function public.hybrid_search(
  query_text text,
  query_embedding vector(1024),
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

grant execute on function public.hybrid_search(text, vector(1024), int, text, int)
  to authenticated, service_role;
