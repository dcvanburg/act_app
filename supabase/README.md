# Supabase

Database migrations for the ACT app.

**Magic-link login:** deploy the `auth-callback` edge function and configure
redirect URLs — see [docs/SUPABASE_AUTH_SETUP.md](../docs/SUPABASE_AUTH_SETUP.md).

## Applying migrations

```bash
# Option 1: via the Supabase CLI (recommended for fresh projects)
npx supabase link --project-ref atscybinltwlaaucthsl
npx supabase db push

# Option 2: via the Supabase Studio SQL editor
# Paste each migrations/*.sql file in order, hit Run.
```

The existing `atscybinltwlaaucthsl` project already has the initial schema
applied (set up during the pre-pivot Next.js work). Re-applying
`0001_initial_schema.sql` is safe — every statement is idempotent.

## Migration order

Migrations apply in lexical order. Use a `NNNN_short_name.sql` filename pattern.

| File                                  | Adds                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `0001_initial_schema.sql`             | `profiles`, `user_progress`, `journal_entries`, RLS                      |
| `0002_mood_logs.sql`                  | `mood_logs` (daily mood check-in)                                        |
| `0003_profiles_subscription_tier.sql` | Adds `subscription_tier` to pre-pivot `profiles` rows                    |
| `0004_waarden.sql`                    | `waarden`, `waarde_acties`, `waarde_barriers`, `waarde_checkins`         |
| _(future)_                            | `exercise_logs`, `streaks`, `user_badges`, `weekly_checkins` — Phase 2-γ |

## Row Level Security

Every table that holds user data has RLS enabled and a policy keyed on
`auth.uid() = user_id` (or `auth.uid() = id` for `profiles`). No table grants
unauthenticated access. The anon key cannot read any user data — only what the
authenticated `auth.uid()` is allowed.

## Article 9 (AVG/GDPR) note

`journal_entries`, `mood_logs`, `waarden` tables, and later `exercise_logs` /
`weekly_checkins`,
hold mental-health data classified as bijzondere persoonsgegevens under
AVG Article 9. They:

- Live only in the EU region (Frankfurt — confirmed 2026-06-09)
- Are encrypted in transit (TLS) and at rest (Supabase default)
- Are subject to the in-app account-deletion cascade (`ON DELETE CASCADE` on
  every FK back to `profiles`)
- Are never sent to third-party analytics

See `docs/SECURITY.md` for the full policy.
