---
name: security-review
description: >-
  Reviews auth, intake, journal, progress, and crisis flows for security and
  therapeutic safety. Use when touching safety check, noodhulp, emergency button,
  user data storage, or GDPR-related code.
allowed-tools: Read, Grep, Glob, Bash
---

# Security Review

Read `docs/SECURITY.md` first.

## Checklist

### Therapeutic safety

- [ ] Crisis disclaimers present and accurate (Dutch)
- [ ] 0800-0113 visible on crisis path
- [ ] Safety check cannot be skipped silently
- [ ] Emergency button always reachable
- [ ] No guilt-framing on relapse/setback flows

### Application security

- [ ] No secrets in code or commits
- [ ] Journal/progress access scoped to current user
- [ ] XSS: user journal content sanitized on render
- [ ] CSRF on state-changing API routes
- [ ] Input validation on intake and journal

### Privacy

- [ ] Minimal data collection
- [ ] No health data to third-party analytics without consent
- [ ] Delete/export path considered for user data

## Verdict

**PASS** / **FAIL** with numbered findings (Critical / High / Medium).
