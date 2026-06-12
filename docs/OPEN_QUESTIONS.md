# Open Questions — Stakeholder Input Needed

Answer these before or during Phase 1 implementation. Mark resolved items with date and decision.

## Product

| #   | Question                                                                                  | Impact                              | Answer                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Auth model:** Anonymous (local storage) vs account required (email)?                    | Progress sync, journal backup, GDPR | **Resolved 2026-06-08:** Account required. Supabase email magic-link. No anonymous mode in v1. See ADR-003.                                       |
| 2   | **Intake personalization:** Same path for all, or conditional content per complaint type? | Content structure, UI complexity    | **Resolved 2026-06-08:** Conditional paragraphs. `examples` field per section; therapist provides per-complaint-type text. See TECHNICAL_SPEC.md. |
| 3   | **Completed module revisit:** Read-only review or full replay with progress reset option? | Navigation UX                       | **Resolved 2026-06-08:** Read-only, single scrollable page. No pagination, no step tracking.                                                      |
| 4   | **Monetization:** Free, freemium, or one-time purchase?                                   | Auth, paywall, scope                | **Resolved 2026-06-08:** Free pilot. `subscriptionTier` placeholder on profile. Paywall logic added post-pilot.                                   |
| 5   | **Therapist branding:** App name final? Logo/colors?                                      | Design system                       | _TBD_ — working title: _Van Overleven naar Leven_                                                                                                 |

## Technical

| #   | Question                                                          | Impact           | Answer                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | **Database:** Confirm Supabase (EU) or alternative?               | ADR-001          | _TBD_                                                                                                                                                                                    |
| 7   | **Push notifications:** Web push, email, or skip for v1?          | P2 scope         | **Resolved 2026-06-08:** Skip entirely for v1. Revisit after pilot.                                                                                                                      |
| 8   | **Offline:** Required for emergency button only, or full modules? | PWA scope        | **Resolved 2026-06-09:** Connection required. App will NOT function without network. Crisis page, modules, journal — all require connectivity. Decision reaffirmed after brief reversal. |
| 9   | **Analytics:** Any usage analytics (privacy-preserving)?          | GDPR, consent UI | **Resolved 2026-06-08:** Decide after pilot. Env var placeholder kept in `.env.example`. No wiring in v1.                                                                                |
| 10  | **Domain:** Production URL? (e.g. `vanoverlevennaarleven.nl`)     | Deploy config    | _TBD_                                                                                                                                                                                    |

## Content & legal

| #   | Question                                                                                                              | Impact                                                        | Answer                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | **Safety screening:** Exact questions for crisis detection?                                                           | Onboarding block logic                                        | _TBD_                                                                                                                                                                            |
| 12  | **Privacy policy & terms:** Who drafts Dutch legal pages?                                                             | Launch blocker (Apple requires privacy URL before submission) | _TBD_                                                                                                                                                                            |
| 13  | **Audio:** Therapist records all, or text-only for v1?                                                                | Audio component scope                                         | **Resolved 2026-06-08:** No audio in v1. Body exercises are text-only (transcript displayed directly). Audio player added in a future sprint.                                    |
| 14  | **Pilot:** Timeline and group size for user testing?                                                                  | Step 4 from concept doc                                       | _TBD_                                                                                                                                                                            |
| 15  | **Public crisis URL after Expo pivot:** Keep `act-app-xi.vercel.app/noodhulp` reachable in a browser, or in-app only? | Crisis safety net for people without the app installed        | **Resolved 2026-06-09 (provisional):** In-app only. Therapist to confirm before pilot — standard practice for AVG Article 9 mental-health apps is a public crisis page fallback. |
| 16  | **Apple/Google developer accounts:** Who owns them and pays?                                                          | EAS Build, TestFlight, Play Internal Testing                  | _TBD_                                                                                                                                                                            |
| 17  | **App name (store listing):** Final name for App Store / Play Store?                                                  | Store submission                                              | _TBD_ — working title "Van Overleven naar Leven"                                                                                                                                 |
| 18  | **App icons + splash + screenshots:** Asset source?                                                                   | Required for store submission                                 | _TBD_                                                                                                                                                                            |

## RAG chatbot (2026-06-12)

See [ADR-005](./ADR/005-rag-chatbot.md) for context. These six items gate Phase 1 of the chatbot work.

| #   | Question                                                                                                                              | Impact                                                                     | Answer                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 19  | **Embedding provider:** Voyage AI `voyage-3-lite` (512 dims, free 200M tokens/m) vs OpenAI `text-embedding-3-small` (1536 dims, paid)? | Locks `vector(N)` in migration 0009 forever — HNSW index cannot be resized | ✅ **Resolved 2026-06-12:** Voyage AI `voyage-3-lite` (512 dims). See ADR-005.                                                             |
| 20  | **LLM routing:** Direct Anthropic API (US-hosted) vs AWS Bedrock Frankfurt (EU)? Zero-retention agreement with Anthropic? Voyage AI DPA? | AVG Article 9 compliance; pilot launch; privacy policy                  | ✅ **Resolved 2026-06-12 (routing):** Direct Anthropic API (US). ⚠️ **Still required pre-pilot:** Anthropic DPA + zero-retention agreement + Voyage AI DPA. |
| 21  | **Chat route placement:** Top-level `/chat` tab (always available to authed users) vs unlock after intake vs in-module contextual helper? | Navigation, intake flow, when chatbot first becomes usable             | ✅ **Resolved 2026-06-12:** Card / button on `/home` linking to `app/(app)/chat.tsx`. See ADR-005.                                         |
| 22  | **Phase / module filter:** Restrict retrieved chunks to the user's current ACT module, or allow questions across all unlocked content? | Retrieval scope; whether `UserProgress.modules` drives `filterPhase`    | ⚠️ Open. **Recommendation:** ship v1 without a phase filter; add in v2 if retrieval noise warrants it.                                     |
| 23  | **Therapist sign-off:** Who reviews the Dutch system prompt and every ingested document? Cadence of re-review when modules change?    | All phases — non-negotiable before any pilot user                       | ✅ **Resolved 2026-06-12:** User acts as therapist via `/therapeut` skill. Real-human therapist review still recommended before pilot.     |
| 24  | **Crisis-signal keyword list:** Final Dutch keyword list for the pre-LLM safety filter (`chat-safety.ts`)?                            | Phase 3 client code; therapeutic safety                                 | ✅ **Resolved 2026-06-12:** Approved v1.0 in [docs/THERAPEUT_KB/chatbot-drafts.md § 2](./THERAPEUT_KB/chatbot-drafts.md#2-crisis-signal-keyword-list-dutch). Re-review every quarter or on major content changes. |

## Pivot to Expo (2026-06-09)

Decisions made for the Next.js → Expo pivot:

| Decision         | Choice                                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| Pivot scope      | Replace Next.js entirely with Expo (no monorepo, no web companion)            |
| Router           | Expo Router (file-based)                                                      |
| Supabase project | Reuse existing `atscybinltwlaaucthsl` (subject to EU region confirmation, #6) |
| Crisis URL       | In-app only (provisional — see #15)                                           |
| Pilot urgency    | Months out — rebuild has time                                                 |

## Resolved

| #   | Question                    | Decision                                                                                                                                  | Date       |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Auth model                  | Account required; Supabase email magic-link. See ADR-003.                                                                                 | 2026-06-08 |
| —   | Module completion trigger   | Automatic when user reaches the last screen/step of a module — no explicit button tap required.                                           | 2026-06-08 |
| —   | Save-and-resume granularity | Per screen/page within a module. Each paginated screen has an ID stored as `lastStepId`. Requires in-module pagination.                   | 2026-06-08 |
| —   | Brand / design tokens       | Primary teal `#2A9D8F` (Praktijk Vitalis). Refine with exact site values before design polish pass. See `.claude/rules/frontend.md`.      | 2026-06-08 |
| 3   | Completed module revisit    | Read-only single scrollable page. No pagination, status stays `completed`.                                                                | 2026-06-08 |
| 4   | Monetization                | Free pilot. `subscriptionTier: 'free'` on profile. No paywall logic in v1.                                                                | 2026-06-08 |
| 7   | Push notifications          | Skip for v1. Revisit after pilot.                                                                                                         | 2026-06-08 |
| 8   | Offline / PWA               | Connection required. Briefly reversed to "works offline" on 2026-06-09, then re-reversed same day. App will not function without network. | 2026-06-09 |
| 9   | Analytics                   | Decide after pilot. Env var placeholder kept. No wiring in v1.                                                                            | 2026-06-08 |
| 13  | Audio                       | No audio in v1. Body exercises are text-only. Audio player added in a future sprint.                                                      | 2026-06-08 |
| 19  | RAG embedding provider      | Voyage AI `voyage-3-lite` (512 dims). See ADR-005.                                                                                        | 2026-06-12 |
| 20  | RAG LLM routing             | Direct Anthropic API (US-hosted). DPAs + zero-retention agreement required pre-pilot.                                                     | 2026-06-12 |
| 21  | Chat route placement        | Card / button on `/home` linking to `app/(app)/chat.tsx`.                                                                                 | 2026-06-12 |
| 23  | Chatbot therapist sign-off  | User acts as therapist via `/therapeut` skill. Real-human review still recommended pre-pilot.                                             | 2026-06-12 |
| 24  | Chatbot crisis keyword list | Approved v1.0 in `docs/THERAPEUT_KB/chatbot-drafts.md § 2`. Re-review every quarter or on major content changes.                          | 2026-06-12 |
