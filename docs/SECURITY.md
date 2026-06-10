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

## Authentication (TBD)

See [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md). Until decided:

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

## Content security

- Therapeutic content is therapist-owned; no copying from copyrighted ACT workbooks
- Audio files: verify licensing before upload
- User journal: not visible to other users; no public sharing in v1
