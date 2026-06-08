# ADR-001: Technology Stack

**Status:** Accepted  
**Date:** 2026-06-08  
**Context:** Self-guided ACT therapeutic web app; Dutch UI; account-required auth; mobile-first; GDPR; EU hosting; no audio in v1; no PWA in v1.

## Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 15** (App Router) | Auth middleware, RSC for module content, SSR for crisis/safety pages, Vercel integration |
| Language | **TypeScript** (strict mode) | Type safety for unlock logic, progress model, and content schemas |
| Styling | **Tailwind CSS** | Mobile-first; custom brand tokens; accessible focus states |
| UI components | **shadcn/ui** | Accessible primitives; composable; built for React Hook Form + Tailwind |
| Content | **JSON in `src/content/nl/`** | Dutch content editable without code changes; Zod-validated at build time |
| Database | **PostgreSQL via Supabase** | Auth + DB + future Storage in one project; EU region; RLS for health data isolation |
| Auth | **Supabase Auth — email magic-link** | Account required from first use; no anonymous mode; passwordless = low friction |
| State — server | **TanStack Query** | Client-side caching + optimistic updates for progress and journal mutations |
| State — auth | **`@supabase/ssr` helpers** | Server component + middleware auth state; no extra library needed |
| State — UI | **React `useState` / `useReducer`** | Pagination, modals, local UI — no global store needed |
| Forms | **React Hook Form + Zod** | shadcn/ui form components are built for this pair; Zod shared with content validation |
| Runtime validation | **Zod** | Content JSON schemas + form schemas; `scripts/validate-content.ts` runs in CI |
| Testing — unit | **Vitest + @testing-library/react** | Better ESM support than Jest; faster; works with Next.js 15 without config hacks |
| Testing — E2E | **Playwright** | Auth flow, module unlock gate, safety check block, Noodknop visibility on all screens |
| Email | **Supabase built-in** (v1) | Magic-link only in v1; upgrade to **Resend** for custom transactional emails post-v1 |
| Hosting | **Vercel** | Preview URLs per PR (therapist can review before deploy); EU edge |
| CI/CD | **GitHub Actions + Vercel git integration** | GitHub Actions: typecheck → lint → test → build; Vercel: auto-deploy on merge to main |
| Pre-commit | **Husky + lint-staged** | Enforce lint + types locally before push; catch issues before CI |
| i18n | **Single locale (nl)** for v1 | No i18n framework; see ADR-002 |
| Audio hosting | **Out of v1 scope** | No audio in v1; use Supabase Storage when therapist recordings are ready |
| PWA | **Out of v1 scope** | Skip for v1; revisit after pilot based on user feedback |

## GDPR note — Vercel and health data

Vercel serverless function logs can capture request metadata and bodies. Health-related data (journal entries, progress, intake selections) must be stored **exclusively in Supabase** — never logged at the Vercel function layer.

- Disable Vercel Analytics unless a cookie-free, GDPR-compliant configuration is confirmed
- Do not log request bodies in API route handlers
- All PII (email, health data) lives in Supabase (EU region); Vercel handles only rendering and routing

## Alternatives considered

| Option | Rejected because |
|--------|------------------|
| Native iOS/Android | No single URL; higher cost; web reach is required |
| Remix | Also good for auth/routing, but smaller ecosystem; team familiarity with Next.js |
| Bubble/Adalo | Harder to version-control; limited navigation logic; no custom RLS |
| SPA only (Vite) | Weaker SSR for crisis/safety pages; no middleware auth |
| Neon (DB) | Supabase already chosen for auth — single project reduces complexity |
| Anonymous-first auth | Health data requires server-side storage from day one; migration adds complexity |
| Jest | Slower than Vitest; ESM config pain with Next.js 15 |
| Redux / Zustand | Overkill — TanStack Query handles server state; local state handles UI |
| next-pwa / Serwist | PWA out of v1 scope; no offline requirement confirmed |

## Consequences

- Single Supabase project handles auth, database, and future audio storage
- TanStack Query + RSC gives a clear boundary: server components fetch on the server, client mutations go through TanStack Query
- Zod appears in three places (content validation, forms, API input) — import from a shared `src/lib/schemas/` directory
- Playwright E2E tests are the primary safety net for unlock logic and crisis flows — unit tests alone are insufficient
- Vercel preview deploys on every PR give the therapist a URL to review Dutch copy before merge
- GitHub Actions CI must pass before Vercel deploys (branch protection)

## Open items

| # | Item | Blocks |
|---|------|--------|
| 1 | Confirm Supabase EU region for the actual project | Database setup, GDPR documentation |
| 2 | Confirm production domain (OPEN_QUESTIONS #10) | Vercel project config, Supabase redirect URLs, magic-link email domain |

All other stack decisions are resolved. Update this ADR when the above are confirmed.
