# Van Overleven naar Leven (act_app)

Self-guided ACT therapeutic web app. Dutch UI, English codebase.

@AGENTS.md

## Commands

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm test` — Vitest unit tests
- `npm run test:e2e` — Playwright E2E tests
- `npm run validate:content` — check for [PLACEHOLDER] in safety-critical content

## Key paths

- Dutch content: `src/content/nl/`
- Module specs: `docs/MODULES.md`
- Open decisions: `docs/OPEN_QUESTIONS.md`
- Therapist placeholders: `docs/CONTENT_PLACEHOLDERS.md`

## Non-negotiables

- User-facing text: Dutch from content JSON only
- Emergency button visible on all screens after first load
- Crisis flow and disclaimers must not be weakened
- Never commit secrets or `.env`
- Never push to `main`; use feature branches and PRs
- Run `/verify` before opening a PR
- Minimize diff scope

## Before implementing features

1. Read relevant doc in `docs/`
2. Check `docs/OPEN_QUESTIONS.md` for unresolved decisions
3. Use `/plan` for multi-file work
4. Use `/security` for intake, auth, journal, or crisis changes
