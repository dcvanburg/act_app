# ADR-005: RAG Chatbot for Module Content Q&A

**Status:** Accepted (provisional — pending DPAs and pilot review)
**Date:** 2026-06-12
**Builds on:** ADR-001 (stack), ADR-003 (auth)
**Resolves:** OPEN_QUESTIONS.md #19, #20, #21, #23, #24 (decided 2026-06-12). #22 still open (recommendation: defer phase filter to v2).

## Context

Users working through the 8-module ACT program will have questions about content already in the app: "what is defusion?", "which exercise helps when I feel overwhelmed?", "what does the avoidance cycle mean for chronic pain?". A small, scoped chatbot — retrieving from therapist-approved Dutch content only — can answer these without forcing users to scroll through prior modules.

The chatbot is explicitly **not** a therapeutic agent. It is a content lookup tool that synthesises short Dutch summaries from the therapist's own written material. It must never give clinical advice, never invent content not in the index, and must hand off to `/noodhulp` the moment a crisis signal appears.

This ADR supersedes the line in [TECHNICAL_SPEC.md](../TECHNICAL_SPEC.md) "Out of scope (v1): AI-generated therapeutic content" — the scope is now narrowed to "AI-synthesised summaries of therapist content, with no novel clinical advice".

## Decision (proposed)

Build a **Hybrid Retrieval-Augmented Generation (RAG)** chatbot:

| Layer | Choice | Rationale |
| ----- | ------ | --------- |
| Retrieval — vector | **pgvector** (HNSW index) | Already in Supabase Postgres; semantic match for Dutch synonyms |
| Retrieval — keyword | **Postgres tsvector (`'dutch'` config)** | Exact-term match for therapy-specific vocabulary |
| Fusion | **Reciprocal Rank Fusion (RRF, k=60)** | Combines both rankings; chunks that score on both win |
| Embeddings | **Voyage AI `voyage-3-lite`** (decided 2026-06-12) | Free tier 200M tokens/month; Anthropic-recommended; 512 dims. Locks `vector(512)` in migration 0009. |
| LLM | **Claude Haiku 4.5** (`claude-haiku-4-5`) | Cheapest Anthropic tier suitable for grounded summarisation |
| LLM routing | **Direct Anthropic API (US-hosted)** (decided 2026-06-12) | Lowest latency; simplest Edge Function. **Requires** Anthropic DPA + zero-retention agreement before pilot. |
| LLM caching | **Anthropic prompt caching** on system prompt | ~90 % cost reduction on cached system tokens |
| Backend | **Supabase Edge Function** (`search`) | Same auth surface as existing functions; JWT-protected |
| Ingest | **Node script (`scripts/ingest-rag-content.ts`)** invoked manually with service role | No public ingest endpoint — chunks are append-only therapist content |
| Frontend entry | **Card / button on `/home`** (decided 2026-06-12) | Lowest-commitment placement. New `ChatHomeCard` component links to `app/(app)/chat.tsx`. Easy to remove or relocate later. |
| Sign-off | **User acts as therapist via `/therapeut` skill** (decided 2026-06-12) | Drafts in `docs/THERAPEUT_KB/chatbot-drafts.md`. Real-human therapist review still recommended before pilot. |

### Data flow per request

```
User types question in app
  │
  ▼
chat-safety.ts → containsCrisisSignal(question)
  │                         │
  │ false                    │ true
  ▼                         ▼
useChatMutation       Show deflection card + link to /noodhulp
  │                   (LLM never called)
  ▼
POST /functions/v1/search        (Supabase Edge Function, JWT-authed)
  │
  ├─ getEmbedding(question)       → Voyage AI
  ├─ hybrid_search() RPC          → top-5 chunks via RRF
  ├─ Crisis keyword pre-check     → second guard, server-side
  ├─ askClaude(question, chunks)  → Anthropic API, with system prompt
  │                                  + last 3 turns of history
  ▼
Response: { answer: string, chunksFound: number }
  │
  ▼
Rendered as message bubble in client
```

### Safety guardrails (non-negotiable)

1. **Crisis keyword pre-filter — client AND server.** A Dutch keyword list (e.g. "zelfmoord", "mezelf iets aandoen", "niet meer leven", "einde maken") bypasses retrieval entirely and returns a hardcoded deflection that links to `/noodhulp`. Implemented in both [src/lib/chat-safety.ts] (client UX) and the Edge Function (defence in depth). Keyword list reviewed by `therapeut` agent.
2. **System prompt constrains scope.** Claude is instructed: answer only from the supplied context; if the answer is not present, say so and refer the user to their huisarts / GGZ / crisis line (matching the wording in [src/content/nl/crisis.json](../../src/content/nl/crisis.json)); never give medical advice or diagnoses.
3. **No message storage.** Chat history lives only in app memory (cleared on app close). Server-side `chat_sessions` table stores at most a counter (`message_count`) per session — no message bodies. This is the only persistent trace.
4. **Auth required.** Edge Function rejects requests without a valid Supabase JWT — anonymous chat is not permitted (consistent with ADR-003).
5. **Therapist sign-off on system prompt + ingested content.** Both the Dutch system prompt and every document ingested into `chunks` go through the `therapeut` agent / clinical review before reaching production. Tracked in [CONTENT_PLACEHOLDERS.md](../CONTENT_PLACEHOLDERS.md).
6. **Disclaimer in UI.** Every chat session shows a Dutch disclaimer pulled from `src/content/nl/chat.json` referencing `crisis.json` resources — not a hardcoded string.

## GDPR / AVG considerations

Chat content is **likely Article 9 data** (a question like "ik heb veel angst rond mijn pijn" reveals mental-health status). The data flow involves two non-EU processors by default:

| Vendor | Data sent | Region | DPA required |
| ------ | --------- | ------ | ------------ |
| **Anthropic** | Question + last 3 turns + retrieved chunks | US (direct API) or EU (AWS Bedrock Frankfurt) | Yes — see OPEN_QUESTIONS #20 |
| **Voyage AI** | Question only (embedded) | US | Yes — see OPEN_QUESTIONS #20 |
| **Supabase** | Question (transient in Edge Function logs) | Existing project (EU region — confirm OPEN_QUESTIONS #6) | Already in place |

Mitigations:

- Default routing TBD (OPEN_QUESTIONS #20): direct Anthropic API (faster, US-hosted) vs AWS Bedrock Frankfurt (EU, slightly higher latency, slightly different model lineup).
- Anthropic offers a **zero data retention** option for enterprise — apply for it before pilot to avoid model training / 30-day retention on prompts.
- Voyage AI: input is only the user question (no retrieved chunks), reducing data sensitivity.
- Edge Function **must not log** request bodies. Add a CI test that greps the function for `console.log` of `question` or `history`.
- Privacy policy (OPEN_QUESTIONS #12) must list both processors and the chatbot purpose before any pilot user touches the feature.

## Alternatives considered

| Option | Rejected because |
| ------ | ---------------- |
| Vector-only retrieval (no FTS) | Misses exact-term recall on therapy-specific vocabulary (e.g. "defusie", "waardencompas"); Dutch FTS adds value at near-zero cost |
| Pre-written FAQ | Doesn't scale to 8 modules + daily practice + intake; can't paraphrase therapist material flexibly |
| Local on-device model | RN-friendly LLMs (e.g. Llama-3-8B on CoreML) are too large for app bundle and too weak for grounded Dutch summarisation |
| OpenAI text-embedding-3-small (1536 dims) instead of Voyage | Paid; not Anthropic-recommended; locks dim choice if we later add OpenAI alternatives — Voyage default keeps options open |
| Storing full conversation history server-side | Article 9 data — every retained message is a data-minimisation violation; in-memory only is sufficient for our 3-turn context window |
| Public ingest endpoint | Content is therapist-owned and curated; a manual script invoked by an admin with the service role keeps the trust boundary tight |

## Consequences

- Adds a vendor dependency on Anthropic (LLM) and Voyage AI (embeddings) — both require DPAs and privacy-policy updates.
- Adds a new Supabase migration (`0009_rag_chunks.sql`) with three tables: `documents`, `chunks`, `chat_sessions`. Vector dimension is **locked at migration time** — changing the embedding provider later requires a re-ingest and a new migration.
- Adds two Edge Functions: `search` (user-facing, JWT-authed) and `ingest` (service-role only, optional — may be replaced by a local Node script).
- Adds a new top-level route (`/chat` or similar — see OPEN_QUESTIONS #21) inside the `(app)` group.
- Therapist workload increases: review system prompt, review ingested content, periodic re-review as modules evolve.
- Estimated marginal cost at 100 questions/day: **< €1/month** with prompt caching enabled (per Claude.ai cost model).

## Open items

| #  | Item | Status |
| -- | ---- | ------ |
| 19 | Embedding provider | ✅ **Decided 2026-06-12:** Voyage AI `voyage-3-lite` (512 dims) |
| 20 | LLM routing | ✅ **Decided 2026-06-12:** Direct Anthropic API (US). DPAs + zero-retention agreement still required before pilot. |
| 21 | Chat route placement | ✅ **Decided 2026-06-12:** Card / button on `/home`. Route at `app/(app)/chat.tsx`. |
| 22 | Phase filter from `UserProgress` | ⚠️ Open. **Recommendation:** ship v1 without a phase filter (retrieve across all ingested content); add filter in v2 if retrieval noise warrants it. |
| 23 | Therapist sign-off process | ✅ **Decided 2026-06-12:** User acts as therapist via `/therapeut` skill. Drafts in [docs/THERAPEUT_KB/chatbot-drafts.md](../THERAPEUT_KB/chatbot-drafts.md). Real-human review still recommended before pilot. |
| 24 | Crisis-signal keyword list | ✅ **Approved 2026-06-12:** v1.0 in [docs/THERAPEUT_KB/chatbot-drafts.md § 2](../THERAPEUT_KB/chatbot-drafts.md#2-crisis-signal-keyword-list-dutch). Re-review every quarter. |

**Pre-pilot blockers (still required even with Accepted status):**

- Anthropic Data Processing Agreement (Article 28 AVG) signed
- Anthropic zero-data-retention agreement applied (no prompt retention, no training)
- Voyage AI Data Processing Agreement signed
- Privacy policy lists both processors and the chatbot purpose
- Supabase project EU region confirmed (OPEN_QUESTIONS #6)
- Real-human therapist review of `chatbot-drafts.md` before any pilot user touches the feature
