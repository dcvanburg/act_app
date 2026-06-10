# Development Workflow

## Language convention

| Layer                                        | Language        |
| -------------------------------------------- | --------------- |
| Source code (variables, functions, comments) | English         |
| User-facing UI strings                       | Dutch (`nl-NL`) |
| Dev documentation                            | English         |
| Therapeutic content (modules, exercises)     | Dutch           |
| Git commits & PR descriptions                | English         |

All Dutch UI strings live in `src/content/nl/` or i18n files — never hardcoded in components without going through the content layer.

## Branch strategy

- `main` — production-ready; protected
- `feature/<short-description>` — all work
- No direct commits or pushes to `main`

## Definition of done

- [ ] Feature matches [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) or linked issue
- [ ] Dutch UI copy added to content layer (not inline English)
- [ ] Safety/crisis flows unchanged or reviewed if touched
- [ ] `/verify` passes (build, lint, types, tests when applicable)
- [ ] `/review` completed for non-trivial changes
- [ ] No secrets, debug logs, or placeholder English in user-facing screens

## AI-assisted development flow

```
1. /plan <feature>     → planner agent; implementation plan only
2. Implement           → minimal diff; match existing patterns
3. /verify             → verification-loop skill
4. /review             → code-reviewer agent
5. /security           → if auth, intake, journal, or crisis flows touched
6. PR                  → human review; therapist review for content changes
```

## Content workflow (therapist)

1. Therapist fills placeholders in [CONTENT_PLACEHOLDERS.md](./CONTENT_PLACEHOLDERS.md)
2. Content added to `src/content/nl/modules/`
3. Developer wires content to UI components
4. Therapist reviews in staging URL before production

## Release checklist

- [ ] Crisis line and disclaimers visible and correct
- [ ] Emergency button works on all main screens
- [ ] Module unlock logic verified
- [ ] Privacy policy URL live (Dutch)
- [ ] No English leakage in user-facing UI
