# AGENTS.md — Van Overleven naar Leven (act_app)

Self-guided ACT therapeutic mobile app. **UI: Dutch. Code: English.**

**Pivot in progress (2026-06-09):** moving from Next.js web → Expo (React Native). Pre-pivot state preserved at `git tag pre-expo-pivot-v0`. See ARCHIVE_NOTICE.md.

## Project

- **Name:** Van Overleven naar Leven
- **Purpose:** 8-module therapeutic program (ACT + body work) for chronic pain, mental health, and addiction-related complaints
- **Audience:** Dutch-speaking adults; not a crisis or clinical replacement tool
- **Delivery:** iOS (TestFlight → App Store) and Android (Internal Testing → Play Store) via EAS Build

## Docs (read before implementing)

| Doc                            | Use                                                               |
| ------------------------------ | ----------------------------------------------------------------- |
| `ARCHIVE_NOTICE.md`            | What survives the pivot and what is being replaced                |
| `docs/PRODUCT.md`              | Vision, philosophy, scope                                         |
| `docs/MODULES.md`              | Per-module specification                                          |
| `docs/TECHNICAL_SPEC.md`       | Features, progress model, safety                                  |
| `docs/NAVIGATION.md`           | Routes, unlock rules, emergency button                            |
| `docs/SECURITY.md`             | GDPR, crisis flows, boundaries                                    |
| `docs/WORKFLOW.md`             | Branching, definition of done                                     |
| `docs/ADR/001-stack.md`        | Stack (now: Expo, TypeScript, NativeWind)                         |
| `docs/ADR/002-i18n.md`         | Dutch content in `src/content/nl/`                                |
| `docs/ADR/003-auth.md`         | **Accepted:** account required, Supabase magic-link via deep link |
| `docs/CONTENT_PLACEHOLDERS.md` | Therapist content still needed                                    |
| `docs/THERAPEUT_KB/`           | Therapist agent knowledge base (concept + ACT reference)          |
| `docs/OPEN_QUESTIONS.md`       | Unresolved decisions                                              |

## Stack (post-pivot)

- Expo SDK 54+, React Native, TypeScript (strict), Node ≥ 20.19.4
- **Routing:** Expo Router (file-based, mirrors Next.js App Router mental model)
- **Styling:** NativeWind (Tailwind for RN) — same design tokens as the web app
- **State:** TanStack Query (server) + React context (auth/session) + component state (UI)
- **Forms:** React Hook Form + Zod
- **Auth + DB:** Supabase (email magic-link via `expo-linking` deep link `actapp://auth/callback`); token storage in `expo-secure-store`; EU region
- **Local storage:** `expo-secure-store` (sensitive) + `@react-native-async-storage/async-storage` (preferences)
- **Testing:** Vitest + @testing-library/react-native (unit) + Maestro (E2E)
- **Distribution:** EAS Build → TestFlight (iOS) + Play Internal Testing (Android)
- **CI:** GitHub Actions (typecheck, lint, format, test, audit, secrets, content validation, EAS Build)
- **Content:** `src/content/nl/**/*.json` (Zod-validated)

## Project structure (target)

```
act_app/
├── app/                  # Expo Router file-based routes
│   ├── _layout.tsx       # Root: NoodknopButton overlay + providers
│   ├── (public)/         # Crisis + auth routes — no auth guard
│   │   ├── noodhulp.tsx
│   │   ├── login.tsx
│   │   └── auth/callback.tsx
│   ├── (app)/            # Authenticated routes
│   │   ├── home/index.tsx
│   │   ├── modules/[id].tsx
│   │   ├── onboarding/index.tsx
│   │   └── account/index.tsx
├── src/
│   ├── components/       # RN components (no DOM)
│   ├── content/nl/       # Dutch JSON (unchanged from web)
│   ├── lib/              # Pure logic — progress engine, content loader, types
│   ├── providers/        # Auth + query providers
│   └── types/            # Domain types
├── supabase/migrations/  # SQL schema (added during α2)
├── docs/                 # Specifications (English)
└── .claude/              # Claude Code config
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
- RN primitives (`<View>`, `<Text>`, `<Pressable>`) over third-party UI kits unless documented

## Architecture rules

- Linear module unlock: module N requires module N-1 `completed`
- Completed modules always revisitable
- Emergency button (`Noodknop`) on every screen — root layout overlay
- Crisis resources: 0800-0113, huisarts, GGZ — see `src/content/nl/crisis.json`
- Crisis screen accessible without auth (no session check on `/noodhulp`)
- Safety check can block program start — never bypass in code
- Journal/progress = sensitive data — GDPR minimum collection (AVG Article 9)

## Git conventions

- Branch: `feature/<description>` from `dev` (allowed prefixes: feature, fix, hotfix, docs, chore, refactor, test, ci)
- Never commit directly to `main`; never force-push `main`
- Commits: English, imperative mood (`feat: add module unlock logic`)
- Run `/verify` before PR

## Agent delegation

| Situation                                                | Agent               |
| -------------------------------------------------------- | ------------------- |
| Module copy, exercises, placeholders, therapeutic review | `therapeut`         |
| 3+ files or architecture change                          | `planner`           |
| Code complete, before PR                                 | `code-reviewer`     |
| Auth, intake, journal, crisis                            | `security-reviewer` |
| Build/types/lint broken                                  | `build-fixer`       |
| Explore codebase                                         | `explorer`          |

## Safety non-negotiables

- Do not remove or weaken crisis disclaimers or `/noodhulp`
- Crisis screen must remain accessible without authentication
- Do not store health journal data in third-party analytics
- Do not copy copyrighted ACT workbook text — therapist-owned content only
- Do not commit `.env`, secrets, or API keys
- Apple/Google data declarations: Article 9 data must be declared in App Privacy and Data Safety forms before submission
