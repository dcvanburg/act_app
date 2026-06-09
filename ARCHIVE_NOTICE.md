# Archive notice — Next.js implementation

**Date of pivot:** 2026-06-09
**Decision:** Replace the Next.js 15 web app with an Expo (React Native) mobile app.
**Status of Next.js code on `main`:** Frozen — will be removed once the Expo scaffold (PR α1) lands.

## Where the old code lives

| Snapshot | How to retrieve |
|----------|-----------------|
| Final state of the Next.js web app | `git checkout pre-expo-pivot-v0` |
| Tag annotation (what was in the snapshot) | `git show pre-expo-pivot-v0` |

The tag captures the complete Next.js implementation as of merging PR #16: 8 ACT modules, Supabase magic-link auth via `@supabase/ssr`, `/noodhulp` crisis screen, Noodknop overlay, account management, Vercel deployment, and the full CI/Dependabot hardening from the June 2026 audit.

## What survives the pivot

These are pure-TypeScript or pure-content files with no Next.js / DOM dependency. They will be carried over to the Expo app unchanged:

- `src/content/nl/**` — all Dutch content JSON (modules, crisis, intake, common, daily-practice, emergency-grounding)
- `src/lib/progress.ts` — module unlock + progress engine
- `src/lib/content.ts` — module content loader and meta
- `src/types/content.ts` — domain types
- `src/lib/__tests__/progress.test.ts` — unit tests for the progress engine
- `scripts/validate-content.ts` — content placeholder validator
- `docs/**` — all specifications (with light edits for the stack change)
- `.github/workflows/**` — CI workflows (with EAS Build added later)
- `.github/dependabot.yml` — dependency hygiene (groups updated for Expo)
- Husky pre-push hook and branch-name CI check

## What does not survive

These are Next.js / DOM-specific and will be removed when the Expo scaffold lands:

- `middleware.ts` (Next.js Supabase cookie SSR — replaced by `expo-secure-store` token storage)
- `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `components.json`, `next-env.d.ts`
- All files under `src/app/**` (App Router pages) — replaced by `app/**` Expo Router routes
- All files under `src/components/**` (DOM components) — re-implemented in RN primitives
- `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` — replaced by a single mobile-safe client
- `src/providers/QueryProvider.tsx` — re-created with TanStack Query for RN
- `.vercel/` directory and Vercel deployment
- The public crisis URL `act-app-xi.vercel.app/noodhulp` — crisis access becomes in-app only (see OPEN_QUESTIONS.md #15)

## Pivot timeline

| Phase | What | When |
|-------|------|------|
| Phase 0 | Cleanup + this notice + docs rewrite | This PR |
| Phase 2-α | Expo scaffold (6 sequential PRs) | 4–6 weeks |
| Phase 2-β | Core fixes alongside α | parallel |
| Phase 2-γ | iCoach-inspired features (per-feature approval) | After α6 |

See `docs/OPEN_QUESTIONS.md` for unresolved decisions blocking the pivot.
