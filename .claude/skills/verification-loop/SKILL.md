---
name: verification-loop
description: >-
  Runs build, typecheck, lint, tests, security scan, and diff review before PRs.
  Use before opening a PR or after completing a feature.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash
---

# Verification Loop

Run before any PR. Stop on failure unless phase is N/A (no scaffold yet).

## Phase 1: Build

`npm run build` — stop if fails.

## Phase 2: Typecheck

`npm run typecheck` or `tsc --noEmit` — report errors with file:line.

## Phase 3: Lint

`npm run lint` — report violations.

## Phase 4: Tests

`npm test` — report pass/fail. Target meaningful coverage on changed logic.

## Phase 5: Security scan

Check modified files for:

- Hardcoded secrets, API keys
- `console.log` / debug statements
- English strings in user-facing components (should be in `src/content/nl/`)
- Weakened crisis/safety flows

## Phase 6: Diff review

`git diff` — unintended files, large binaries, `.env`, conflict markers.

## Report

| Phase    | Status        | Details |
| -------- | ------------- | ------- |
| Build    | PASS/FAIL/N/A |         |
| Types    | PASS/FAIL/N/A |         |
| Lint     | PASS/FAIL/N/A |         |
| Tests    | PASS/FAIL/N/A |         |
| Security | PASS/FAIL     |         |
| Diff     | PASS/FAIL     |         |

**Overall: READY / NOT READY for PR**
