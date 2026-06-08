# AGENTS.md — Van Overleven naar Leven (act_app)

Self-guided ACT therapeutic web app. **UI: Dutch. Code: English.**

## Project

- **Name:** Van Overleven naar Leven
- **Purpose:** 8-module therapeutic program (ACT + body work) for chronic pain, mental health, and addiction-related complaints
- **Audience:** Dutch-speaking adults; not a crisis or clinical replacement tool

## Docs (read before implementing)

| Doc | Use |
|-----|-----|
| `docs/PRODUCT.md` | Vision, philosophy, scope |
| `docs/MODULES.md` | Per-module specification |
| `docs/TECHNICAL_SPEC.md` | Features, progress model, safety |
| `docs/NAVIGATION.md` | Routes, unlock rules, emergency button |
| `docs/SECURITY.md` | GDPR, crisis flows, boundaries |
| `docs/WORKFLOW.md` | Branching, definition of done |
| `docs/ADR/001-stack.md` | Proposed stack (Next.js, TypeScript) |
| `docs/ADR/002-i18n.md` | Dutch content in `src/content/nl/` |
| `docs/ADR/003-auth.md` | **Accepted:** account required, Supabase magic-link |
| `docs/CONTENT_PLACEHOLDERS.md` | Therapist content still needed |
| `docs/OPEN_QUESTIONS.md` | Unresolved decisions |

## Stack (accepted — see ADR-001)

- Next.js 15, TypeScript (strict), Tailwind, shadcn/ui
- State: TanStack Query (server state) + `@supabase/ssr` (auth) + local state (UI)
- Forms: React Hook Form + Zod
- Testing: Vitest + @testing-library/react + Playwright
- DB/Auth: Supabase (email magic-link; EU region)
- Hosting: Vercel + GitHub Actions CI
- Content: `src/content/nl/**/*.json` (Zod-validated)

## Project structure

```
act_app/
├── docs/                 # Specifications (English)
├── src/content/nl/       # Dutch user-facing content (JSON)
├── .claude/              # Claude Code config
└── .cursor/              # Cursor IDE rules
```

## Language rules

- Code, variables, commits: **English**
- UI strings: **Dutch only** — import from `src/content/nl/`
- Never hardcode Dutch in components; never ship English to users
- `[PLACEHOLDER]` markers = therapist content not yet written

## Code conventions

- Functional React components; TypeScript strict mode
- Colocate feature code; keep modules navigable
- Minimal diff scope — match existing patterns
- Error handling: user-friendly Dutch messages via content layer
- No `console.log` in committed code

## Architecture rules

- Linear module unlock: module N requires module N-1 `completed`
- Completed modules always revisitable
- Emergency button (`Noodknop`) on every screen — fixed position
- Crisis resources: 0800-0113, huisarts, GGZ — see `src/content/nl/crisis.json`
- Safety check can block program start — never bypass in code
- Journal/progress = sensitive data — GDPR minimum collection

## Git conventions

- Branch: `feature/<description>` from `main`
- Never commit directly to `main`; never force-push `main`
- Commits: English, imperative mood (`feat: add module unlock logic`)
- Run `/verify` before PR

## Agent delegation

| Situation | Agent |
|-----------|-------|
| 3+ files or architecture change | `planner` |
| Code complete, before PR | `code-reviewer` |
| Auth, intake, journal, crisis | `security-reviewer` |
| Build/types/lint broken | `build-fixer` |
| Explore codebase | `explorer` |

## Safety non-negotiables

- Do not remove or weaken crisis disclaimers or `/noodhulp`
- Do not store health journal data in third-party analytics
- Do not copy copyrighted ACT workbook text — therapist-owned content only
- Do not commit `.env`, secrets, or API keys
