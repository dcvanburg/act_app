-- Allow an 'overview' category on documents for program-level context
-- (what Van Overleven naar Leven is, ACT in plain Dutch, who the chatbot is).
-- Source content: src/content/nl/program-overview.json, ingested via
-- scripts/ingest-rag-content.ts.

alter table public.documents
  drop constraint if exists documents_category_check;

alter table public.documents
  add constraint documents_category_check
  check (category in ('module', 'daily-practice', 'intake', 'exercise', 'overview'));
