# Open Questions — Stakeholder Input Needed

Answer these before or during Phase 1 implementation. Mark resolved items with date and decision.

## Product

| # | Question | Impact | Answer |
|---|----------|--------|--------|
| 1 | **Auth model:** Anonymous (local storage) vs account required (email)? | Progress sync, journal backup, GDPR | **Resolved 2026-06-08:** Account required. Supabase email magic-link. No anonymous mode in v1. See ADR-003. |
| 2 | **Intake personalization:** Same path for all, or conditional content per complaint type? | Content structure, UI complexity | **Resolved 2026-06-08:** Conditional paragraphs. `examples` field per section; therapist provides per-complaint-type text. See TECHNICAL_SPEC.md. |
| 3 | **Completed module revisit:** Read-only review or full replay with progress reset option? | Navigation UX | **Resolved 2026-06-08:** Read-only, single scrollable page. No pagination, no step tracking. |
| 4 | **Monetization:** Free, freemium, or one-time purchase? | Auth, paywall, scope | **Resolved 2026-06-08:** Free pilot. `subscriptionTier` placeholder on profile. Paywall logic added post-pilot. |
| 5 | **Therapist branding:** App name final? Logo/colors? | Design system | _TBD_ — working title: _Van Overleven naar Leven_ |

## Technical

| # | Question | Impact | Answer |
|---|----------|--------|--------|
| 6 | **Database:** Confirm Supabase (EU) or alternative? | ADR-001 | _TBD_ |
| 7 | **Push notifications:** Web push, email, or skip for v1? | P2 scope | **Resolved 2026-06-08:** Skip entirely for v1. Revisit after pilot. |
| 8 | **Offline:** Required for emergency button only, or full modules? | PWA scope | **Resolved 2026-06-09:** Yes — works offline. Module content, crisis screen, grounding exercise, and journal writes all available without connectivity. Sync queues writes for when network returns. Implementation: bundle content JSON in the app binary; queue mutations in `expo-sqlite` or AsyncStorage; flush on reconnect via TanStack Query. |
| 9 | **Analytics:** Any usage analytics (privacy-preserving)? | GDPR, consent UI | **Resolved 2026-06-08:** Decide after pilot. Env var placeholder kept in `.env.example`. No wiring in v1. |
| 10 | **Domain:** Production URL? (e.g. `vanoverlevennaarleven.nl`) | Deploy config | _TBD_ |

## Content & legal

| # | Question | Impact | Answer |
|---|----------|--------|--------|
| 11 | **Safety screening:** Exact questions for crisis detection? | Onboarding block logic | _TBD_ |
| 12 | **Privacy policy & terms:** Who drafts Dutch legal pages? | Launch blocker | _TBD_ |
| 13 | **Audio:** Therapist records all, or text-only for v1? | Audio component scope | **Resolved 2026-06-08:** No audio in v1. Body exercises are text-only (transcript displayed directly). Audio player added in a future sprint. |
| 14 | **Pilot:** Timeline and group size for user testing? | Step 4 from concept doc | _TBD_ |

## Resolved

| # | Question | Decision | Date |
|---|----------|----------|------|
| 1 | Auth model | Account required; Supabase email magic-link. See ADR-003. | 2026-06-08 |
| — | Module completion trigger | Automatic when user reaches the last screen/step of a module — no explicit button tap required. | 2026-06-08 |
| — | Save-and-resume granularity | Per screen/page within a module. Each paginated screen has an ID stored as `lastStepId`. Requires in-module pagination. | 2026-06-08 |
| — | Brand / design tokens | Primary teal `#2A9D8F` (Praktijk Vitalis). Refine with exact site values before design polish pass. See `.claude/rules/frontend.md`. | 2026-06-08 |
| 3 | Completed module revisit | Read-only single scrollable page. No pagination, status stays `completed`. | 2026-06-08 |
| 4 | Monetization | Free pilot. `subscriptionTier: 'free'` on profile. No paywall logic in v1. | 2026-06-08 |
| 7 | Push notifications | Skip for v1. Revisit after pilot. | 2026-06-08 |
| 8 | Offline / PWA | ~~Skip for v1~~ → **Reversed 2026-06-09:** Works offline. Module content + crisis screen + journal/mood writes available without connectivity. Queue + sync on reconnect. | 2026-06-09 |
| 9 | Analytics | Decide after pilot. Env var placeholder kept. No wiring in v1. | 2026-06-08 |
| 13 | Audio | No audio in v1. Body exercises are text-only. Audio player added in a future sprint. | 2026-06-08 |
