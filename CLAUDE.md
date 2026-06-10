# Van Overleven naar Leven (act_app)

Self-guided ACT therapeutic mobile app. Dutch UI, English codebase.

**Pivoting from Next.js web to Expo (React Native) as of 2026-06-09.** Pre-pivot state lives at `git tag pre-expo-pivot-v0`. See ARCHIVE_NOTICE.md.

@AGENTS.md

## Commands (apply once the Expo scaffold lands)

- `npx expo start` — local development (Expo Go / iOS simulator / Android emulator)
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm test` — Vitest unit tests
- `npm run test:e2e` — Maestro E2E tests
- `npm run validate:content` — check for [PLACEHOLDER] in safety-critical content
- `eas build` — production build via EAS

## Key paths

- Dutch content: `src/content/nl/`
- Module specs: `docs/MODULES.md`
- Open decisions: `docs/OPEN_QUESTIONS.md`
- Therapist placeholders: `docs/CONTENT_PLACEHOLDERS.md`

## Non-negotiables

- User-facing text: Dutch from content JSON only
- Emergency Noodknop visible on every screen — top-level RN overlay, min 44pt touch target
- `/noodhulp` crisis screen accessible without auth — first-class top-level route
- Crisis flow and disclaimers must not be weakened
- Never commit secrets or `.env`
- Never push to `main`; use feature branches and PRs
- Run `/verify` before opening a PR
- Minimize diff scope

## Therapeutic content

- Use agent `therapeut` or `/therapeut` for Dutch module copy, exercises, placeholders
- Knowledge base: `docs/THERAPEUT_KB/`
- Skill: `.claude/skills/therapeut-content/`
- Reference (methodology only): [Resiliens ACT Coach](https://www.resiliens.com/nl/act-coach)

## Before implementing features

1. Read relevant doc in `docs/`
2. Check `docs/OPEN_QUESTIONS.md` for unresolved decisions
3. Use `/plan` for multi-file work
4. Use `/security` for intake, auth, journal, or crisis changes
5. Use `/therapeut` for therapeutic content writing or review
