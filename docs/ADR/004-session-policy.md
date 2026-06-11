# ADR-004: Session Duration & Idle Navigation

**Status:** Accepted  
**Date:** 2026-06-11  
**Builds on:** ADR-003 (auth model)

## Decision

The app enforces three session/navigation rules on top of Supabase Auth:

| Rule | Behaviour |
| ---- | --------- |
| **30-day logout** | After login, the session expires at **03:00 Europe/Amsterdam** on the calendar date that is **30 days** after the login date. User is signed out and sees a Dutch expiry message on `/login`. |
| **30-minute idle — onboarding** | If the user is on onboarding screens, module 0 is not `completed`, and the app was inactive ≥ 30 minutes → navigate to the start of onboarding (`/wizard` or `/mood?from=onboarding`). Local step state resets via a `reset` query param. |
| **30-minute idle — default** | Otherwise, if inactive ≥ 30 minutes → `router.replace('/home')`. No-op when already on `/home`. `/noodhulp` is exempt. |

Supabase JWT refresh continues in the background; this policy is enforced client-side.

## Storage

| Key | Location | Purpose |
| --- | -------- | ------- |
| `act_session_anchor_iso` | SecureStore (AsyncStorage on web dev) | Login timestamp for 30-day expiry |
| `act_last_active_iso` | SecureStore | Last foreground activity for idle detection |

Both keys are cleared on `signOut` and forced expiry.

## Implementation

- `src/lib/session-policy.ts` — pure policy functions (unit-tested)
- `src/lib/session-storage.ts` — SecureStore adapter
- `src/providers/SessionPolicyProvider.tsx` — `AppState` listener + navigation
- `src/providers/AuthProvider.tsx` — anchor on `SIGNED_IN`, `startAutoRefresh` on mount

## Supabase alignment

Set Supabase refresh-token TTL to **≥ 30 days** so server-side expiry does not precede the app policy. Document dashboard values when the production project is configured.

## Out of scope (v1)

- Biometric resume lock (`expo-local-authentication` is installed but not wired)
- Idle sign-out (session remains valid; only navigation changes)
- Clearing partial server-side intake progress on idle reset
