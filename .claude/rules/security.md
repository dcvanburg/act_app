# Security & Therapeutic Safety

Applies to all files. Critical for auth, intake, journal, crisis, chatbot flows.

## Crisis & boundaries

- Never remove or bypass safety check in onboarding
- Crisis screen must show: 0800-0113, huisarts, GGZ
- Emergency button (`Noodknop`) must remain globally accessible
- Do not frame relapse or setbacks as failure in copy or logic

## Chatbot / RAG (see `docs/ADR/005-rag-chatbot.md`)

- Crisis keyword pre-filter runs **before** any embedding or LLM call — client AND server (defence-in-depth). Never weaken.
- LLM answers only from retrieved therapist-approved chunks; no medical advice, no invented exercises.
- Chat messages persist in `chat_messages` (RLS, user can wipe via "Gesprek wissen"). LLM gets 3 live turns + memory block of older turns.
- Edge Function must not log `question` or `history` fields. CI test guards against regressions.
- Chat requests require a valid Supabase JWT — no anonymous use.
- Therapist sign-off required on system prompt and every ingested document before pilot.

## Data

- Journal and progress = sensitive; GDPR minimum collection
- No health data to analytics without explicit consent
- Encrypt in transit (TLS); sensitive fields at rest when stored server-side
- Sanitize journal output (XSS prevention)

## Secrets

- No API keys, DB URLs, or tokens in repo
- `.env` is gitignored and hook-protected

## Content

- Do not paste copyrighted ACT workbook text
- Therapist-owned content only; paraphrase public metaphors
