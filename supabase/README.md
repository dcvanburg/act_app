# Supabase

Database migrations and Edge Functions for the ACT app.

**Magic-link login:** deploy the `auth-callback` edge function and configure
redirect URLs — see [docs/SUPABASE_AUTH_SETUP.md](../docs/SUPABASE_AUTH_SETUP.md).

**RAG chatbot search:** deploy the `search` edge function with
`scripts/deploy-rag-functions.sh`. Requires `ANTHROPIC_API_KEY` and
`VOYAGE_API_KEY` set in Supabase Edge Function secrets. See
[docs/ADR/005-rag-chatbot.md](../docs/ADR/005-rag-chatbot.md).

**RAG content ingest** (after applying migrations 0009–0013):

```bash
# Preview chunk counts without API calls
npm run ingest:rag -- --dry-run

# Requires EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY in .env.local
npm run ingest:rag
```

Re-run ingest when module JSON in `src/content/nl/` changes. The ingest
clears existing chunks and documents, then re-inserts everything including
the program-overview (category `overview`) added in migration 0013.

Embeddings are produced with Voyage `voyage-3` (1024 d) since migration 0012.
Earlier ingests used `voyage-3-lite` (512 d); after applying 0012 you **must**
re-run `npm run ingest:rag` before the chatbot will return results.

## Applying migrations

```bash
# Option 1: via the Supabase CLI (recommended for fresh projects)
npx supabase link --project-ref atscybinltwlaaucthsl
npx supabase db push

# Option 2: via the Supabase Studio SQL editor
# Paste each migrations/*.sql file in order, hit Run.
```

The existing `atscybinltwlaaucthsl` project already has the initial schema
applied (set up during the pre-pivot Next.js work). Re-applying
`0001_initial_schema.sql` is safe — every statement is idempotent.

## Migration order

Migrations apply in lexical order. Use a `NNNN_short_name.sql` filename pattern.

| File                                  | Adds                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `0001_initial_schema.sql`             | `profiles`, `user_progress`, `journal_entries`, RLS                      |
| `0002_mood_logs.sql`                  | `mood_logs` (daily mood check-in)                                        |
| `0003_profiles_subscription_tier.sql` | Adds `subscription_tier` to pre-pivot `profiles` rows                    |
| `0004_waarden.sql`                    | `waarden`, `waarde_acties`, `waarde_barriers`, `waarde_checkins`         |
| `0009_rag_chunks.sql`                 | `documents`, `chunks` (pgvector 512 + Dutch FTS), `hybrid_search()` RPC, `chat_sessions` (counter only). RAG chatbot — see ADR-005. |
| `0010_rag_chunks_repair.sql`          | Drops legacy pre-release RAG tables and recreates ADR-005 schema (`source_path`, `module_number`). |
| `0011_hybrid_search_overload_fix.sql` | Drops duplicate `hybrid_search` overloads (legacy `rrf_k` variant). |
| `0012_rag_chunks_voyage3.sql`         | Embedding upgrade: voyage-3-lite (512 d) → voyage-3 (1024 d). Truncates `chunks`, alters column type, recreates HNSW index + `hybrid_search` signature. Triggers full re-ingest. |
| `0013_documents_overview_category.sql`| Allows `category = 'overview'` on `documents` for `src/content/nl/program-overview.json` (what the program is, ACT in plain Dutch, who the chatbot is). |
| `0014_waarden_shared_collection.sql`  | Shared waarden plan/barriers/check-ins (`waarde_id` nullable). |
| `0015_chat_messages.sql`              | `chat_messages` — persisted chat history for conversation memory (ADR-005 update). |
| `0016_chat_sessions.sql`              | `session_id` on messages; one active session per user for current vs full history wipe. |
| `0017_chat_clear_rpc.sql`             | `clear_current_chat_session()` RPC + RLS policy repair for reliable chat wipe. |

## Row Level Security

Every table that holds user data has RLS enabled and a policy keyed on
`auth.uid() = user_id` (or `auth.uid() = id` for `profiles`). No table grants
unauthenticated access. The anon key cannot read any user data — only what the
authenticated `auth.uid()` is allowed.

## Article 9 (AVG/GDPR) note

`journal_entries`, `mood_logs`, `waarden` tables, and later `exercise_logs` /
`weekly_checkins`,
hold mental-health data classified as bijzondere persoonsgegevens under
AVG Article 9. They:

- Live only in the EU region (Frankfurt — confirmed 2026-06-09)
- Are encrypted in transit (TLS) and at rest (Supabase default)
- Are subject to the in-app account-deletion cascade (`ON DELETE CASCADE` on
  every FK back to `profiles`)
- Are never sent to third-party analytics

See `docs/SECURITY.md` for the full policy.
