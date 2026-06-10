# Van Overleven naar Leven

A self-guided therapeutic mobile app based on **Acceptance and Commitment Therapy (ACT)** and body-oriented psychosomatic therapy.

**Status:** Pivoting from Next.js web → Expo (React Native) as of 2026-06-09. Web implementation preserved at `git tag pre-expo-pivot-v0`. See [ARCHIVE_NOTICE.md](./ARCHIVE_NOTICE.md).

The instructions below describe the **target** Expo setup; they apply once the Expo scaffold (PR α1) lands. For the current Next.js setup, check out `pre-expo-pivot-v0`.

## Getting started (target Expo setup)

**Prerequisites:** Node.js ≥ 20, an Expo account, a Supabase project (EU region), Xcode (iOS sim) and/or Android Studio (Android emulator).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# 3. Run the dev server
npx expo start       # press i for iOS sim, a for Android emulator, or scan QR for Expo Go

# 4. Other commands
npm run typecheck         # TypeScript check
npm run lint              # ESLint
npm test                  # Vitest unit tests
npm run test:e2e          # Maestro E2E tests
npm run validate:content  # Check for [PLACEHOLDER] in safety-critical content
eas build --profile preview  # EAS Build (preview channel)
```

**Supabase setup:** Create the tables in `docs/ADR/003-auth.md` → Supabase schema section. Enable email magic-link in the Auth settings. Add `actapp://auth/callback` to the Redirect URLs allowlist.

## For developers

- **UI language:** Dutch (`nl-NL`)
- **Code & docs:** English
- **Start here:** [AGENTS.md](./AGENTS.md) and [docs/PRODUCT.md](./docs/PRODUCT.md)

## Documentation

| Document                                                  | Description                         |
| --------------------------------------------------------- | ----------------------------------- |
| [PRODUCT.md](./docs/PRODUCT.md)                           | Vision, audience, program structure |
| [MODULES.md](./docs/MODULES.md)                           | All 8 modules in detail             |
| [TECHNICAL_SPEC.md](./docs/TECHNICAL_SPEC.md)             | Functional requirements             |
| [NAVIGATION.md](./docs/NAVIGATION.md)                     | Routes and unlock logic             |
| [SECURITY.md](./docs/SECURITY.md)                         | Safety, GDPR, crisis handling       |
| [OPEN_QUESTIONS.md](./docs/OPEN_QUESTIONS.md)             | Decisions still needed              |
| [CONTENT_PLACEHOLDERS.md](./docs/CONTENT_PLACEHOLDERS.md) | Therapist content to fill           |

## Content

Dutch module copy lives in `src/content/nl/`. Most body text is `[PLACEHOLDER]` until the therapist provides final content.

## AI-assisted development

Configured for **Claude Code** (`.claude/`) and **Cursor** (`.cursor/`):

- `/plan` — implementation planning
- `/verify` — pre-PR quality gate
- `/review` — code review

See [docs/WORKFLOW.md](./docs/WORKFLOW.md).

## Safety notice

This app is not a replacement for professional mental health care. Crisis resources (Netherlands): **0800-0113**.
