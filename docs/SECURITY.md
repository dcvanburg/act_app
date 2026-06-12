# Security & Ethics

## Therapeutic boundaries

This app provides self-guided ACT-based content. It must never present itself as emergency or clinical care.

### Mandatory Dutch disclaimers (user-facing)

Show during onboarding and in footer/help:

- Not a replacement for professional help in acute crisis, severe psychiatric conditions, or severe untreated addiction
- Encourage users to seek GP (huisarts), GGZ, or crisis line when needed

### Crisis resources (Netherlands)

| Resource   | Display text (NL)                | Action              |
| ---------- | -------------------------------- | ------------------- |
| Crisislijn | Bel 0800-0113 (24/7)             | `tel:08000113` link |
| Huisarts   | Neem contact op met je huisarts  | Informational       |
| GGZ        | Zoek hulp via je huisarts of GGZ | Informational       |

## Safety check implementation

1. Run during onboarding (before module 0 completion)
2. Questions defined by therapist — see [CONTENT_PLACEHOLDERS.md](./CONTENT_PLACEHOLDERS.md)
3. On positive crisis signal:
   - Block program progression
   - Show crisis screen (`/noodhulp`)
   - Do not collect detailed symptom data beyond screening

### Empty questions guard (REQUIRED)

`src/content/nl/intake.json` `safetyCheck.questions` is currently `[]` (placeholder).
The safety check implementation MUST treat an empty questions array as a **build-time error**,
not a silent pass. Options:

- Validate at build time in `scripts/validate-content.ts` (recommended) — fail CI if empty
- Guard at runtime: if `questions.length === 0`, log a warning and show a fallback screen
  rather than silently allowing all users through

Never ship with an empty safety check that lets all users proceed without screening.

## Data & privacy (GDPR)

| Principle                 | Implementation                                                       |
| ------------------------- | -------------------------------------------------------------------- |
| Data minimization         | Store only progress, journal entries user creates, intake selections |
| Consent                   | Explicit opt-in for notifications and analytics                      |
| Storage                   | Prefer EU region; document processor in privacy policy               |
| Encryption                | TLS in transit; encrypt sensitive data at rest                       |
| Right to erasure          | User can delete all local/account data                               |
| No selling of health data | Hard rule — document in privacy policy                               |

## Authentication

Account required via Supabase magic-link (ADR-003). Client session policy (ADR-004):

- Sessions expire after **30 days** at 03:00 Europe/Amsterdam
- **30-minute idle** returns users to `/home`, or restarts onboarding if module 0 is incomplete
- Tokens stored in `expo-secure-store`; crisis screen `/noodhulp` is never interrupted by idle redirects

- Do not assume social login
- Do not send health data to third-party analytics without consent
- Journal entries are sensitive — treat as special category data under GDPR

## Account deletion (GDPR — right to erasure)

Users have the right to delete all their data.

**Implementation (both required):**

1. **In-app flow** — Settings screen: `Verwijder mijn account` button → confirmation modal → DELETE `profiles` row (cascades to all progress, journal, intake) → session invalidated → redirect to landing page.
2. **Email fallback** — Privacy policy documents: "Stuur een e-mail naar [contact] met het verzoek je account te verwijderen." Response within 30 days per GDPR.

**What is deleted:**

- `profiles` row (and all cascaded rows: `user_progress`, `journal_entries`)
- Supabase Auth user record (call `supabase.auth.admin.deleteUser(id)` server-side)

No data is retained after deletion. Do not add soft-delete in v1.

## Application security

| Threat                           | Mitigation                            |
| -------------------------------- | ------------------------------------- |
| XSS in journal/user content      | Sanitize output; CSP headers          |
| CSRF                             | Tokens on state-changing requests     |
| Secret leakage                   | No secrets in repo; `.env` gitignored |
| Dependency vulnerabilities       | `npm audit` in CI; regular updates    |
| Insecure direct object reference | User can only access own progress     |

## AI development security

- Never commit API keys, `.env`, or therapist audio source files with PII
- Hooks block writes to `.env` and protected branches
- Security-reviewer agent required for auth, intake, and crisis flows

## AI processing — LLM / RAG

Applies to the chatbot in [ADR-005](./ADR/005-rag-chatbot.md). Treat the LLM as an **untrusted summarisation tool**, not a clinician.

### Therapeutic safety

- **Crisis pre-filter is mandatory and runs first.** A Dutch keyword list in `src/lib/chat-safety.ts` (and a copy in the Edge Function for defence-in-depth) routes crisis messages to `/noodhulp` **before** any embedding or LLM call. Never weaken or remove this check.
- **No medical advice.** The system prompt instructs Claude to answer only from the supplied context and refer the user to huisarts / GGZ / 0800-0113 for anything outside that scope. Wording must match [src/content/nl/crisis.json](../src/content/nl/crisis.json).
- **No model-invented exercises or interventions.** If the retrieved context does not contain the answer, the chatbot says so and does not extrapolate.
- **Therapist sign-off** on the Dutch system prompt and every ingested document, tracked in [CONTENT_PLACEHOLDERS.md](./CONTENT_PLACEHOLDERS.md).

### Data minimisation

- **No message storage.** Chat history lives only in app memory and is sent to the LLM as transient context. The `chat_sessions` table stores at most a counter — no message bodies, ever.
- **History window capped at 3 turns** (6 messages) — anything older is dropped before sending to Anthropic.
- **Edge Function must not log request bodies.** A CI grep test guards against `console.log(question)` / `console.log(history)` regressions.
- **Auth required** on every chat request — no anonymous use (consistent with ADR-003).

### Vendor data transfer (AVG Article 9)

The chatbot processes content that often qualifies as Article 9 (health) data. Routing decided 2026-06-12 (ADR-005): direct Anthropic API (US-hosted) for the LLM call, Voyage AI (US) for embeddings. Before any pilot user touches the feature, **all** of the following must be in place:

| Requirement                                                              | Owner       | Status                                    |
| ------------------------------------------------------------------------ | ----------- | ----------------------------------------- |
| DPA with Anthropic                                                       | Legal       | ⚠️ Required pre-pilot (ADR-005)           |
| DPA with Voyage AI                                                       | Legal       | ⚠️ Required pre-pilot (ADR-005)           |
| Anthropic zero-data-retention agreement (no prompt retention / training) | Legal       | ⚠️ Required pre-pilot (ADR-005)           |
| Privacy policy lists both processors and the chatbot purpose             | Legal       | OPEN_QUESTIONS #12                        |
| Supabase project EU region confirmed (so Edge Function logs stay in EU)  | Engineering | OPEN_QUESTIONS #6                         |
| Real-human therapist review of `docs/THERAPEUT_KB/chatbot-drafts.md`     | Therapist   | ⚠️ Recommended pre-pilot                  |

## Content security

- Therapeutic content is therapist-owned; no copying from copyrighted ACT workbooks
- Audio files: verify licensing before upload
- User journal: not visible to other users; no public sharing in v1
