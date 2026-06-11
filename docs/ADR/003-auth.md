# ADR-003: Authentication Model

**Status:** Accepted  
**Date:** 2026-06-08  
**Resolves:** OPEN_QUESTIONS.md #1

## Decision

**Account required** from first use. Authentication via **Supabase email magic-link**.

No anonymous or guest mode in v1.

## Rationale

| Factor                 | Reasoning                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Data sensitivity       | Progress and journal are health-related data — server-side storage is required from day one               |
| Therapeutic continuity | Users switch devices; progress must follow them                                                           |
| Simplicity             | Anonymous → upgrade migration adds complexity with little benefit given the target audience               |
| Low friction           | Magic-link (passwordless) removes the barrier of password management; aligns with ACT's non-coercive tone |

## Consequences

- Users must provide an email before accessing any module content
- All `UserProgress`, intake selections, and journal entries stored in Supabase (EU region)
- Supabase Row Level Security (RLS) required: users can only read/write their own rows
- Next.js middleware guards all routes **except** `/noodhulp` — crisis page is always accessible without auth
- Supabase SSR client (`@supabase/ssr`) required for App Router server components

## Implementation notes

```
Auth flow:
  /login (email)  →  Supabase email (6-digit code + optional link)
                 →  /login (enter code in app)  OR  /auth/callback (deep link)  →  /home

Protected routes (middleware): /onboarding, /modules/*, /oefeningen, /dagboek, /check-in
Public routes:                 /, /noodhulp, /auth/*, /privacy
```

### Supabase email template

The magic-link email must include the OTP token so users can log in without a
working deep link (common on mobile browsers). In Supabase → Authentication →
Email Templates → Magic Link, include `{{ .Token }}` (6-digit code).

Redirect URLs (Authentication → URL Configuration): `actapp://**`, `exp://**`.
Universal Links require a hosted HTTPS callback page (post-v1).

### Supabase schema (minimum)

```sql
-- profiles mirrors auth.users; RLS: user can only select/update their own row
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  created_at  timestamptz default now()
);

-- progress stored as JSONB for flexibility during v1 iteration
create table user_progress (
  user_id     uuid primary key references profiles(id) on delete cascade,
  progress    jsonb not null default '{}',
  updated_at  timestamptz default now()
);

-- journal entries: sensitive health data; RLS required
create table journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  body        text not null
);
```

RLS policies on all tables: `auth.uid() = user_id`.

## Alternatives considered

| Option                      | Rejected because                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| Anonymous (localStorage)    | Data lost on device change; journal not backed up; GDPR right-to-erasure harder to implement |
| Anonymous + upgrade         | Adds migration complexity; account still required eventually                                 |
| Social login (Google, etc.) | Third-party dependency; health-data scope concerns; magic-link is simpler                    |

## Open items from this decision

- Confirm Supabase project region is EU (see OPEN_QUESTIONS.md #6)
- Define right-to-erasure flow (DELETE cascade on profiles row)
- Draft privacy policy section covering email storage (OPEN_QUESTIONS.md #12)
