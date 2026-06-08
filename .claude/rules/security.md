# Security & Therapeutic Safety

Applies to all files. Critical for auth, intake, journal, crisis flows.

## Crisis & boundaries

- Never remove or bypass safety check in onboarding
- Crisis screen must show: 0800-0113, huisarts, GGZ
- Emergency button (`Noodknop`) must remain globally accessible
- Do not frame relapse or setbacks as failure in copy or logic

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
