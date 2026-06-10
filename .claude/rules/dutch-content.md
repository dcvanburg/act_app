---
paths:
  - 'src/content/**'
  - 'src/**/*.{tsx,ts}'
---

# Dutch Content Rules

- All user-visible text: Dutch (`nl-NL`)
- Content files: `src/content/nl/**/*.json`
- Use `[PLACEHOLDER]` for therapist content not yet written
- Never ship English strings to users (errors, labels, buttons)
- **No dash punctuation** in Dutch copy: no `—`, `–`, or `-` as sentence breaks; use `.`, `,`, or `:` instead. Lists: `•` or numbers, not `-`
- Module titles in JSON match concept doc (e.g. "Herkennen", "Acceptatie")
- Crisis copy must match `src/content/nl/crisis.json`; coordinate changes

When adding UI:

1. Add Dutch string to appropriate JSON file
2. Reference by key in component
3. Update `docs/CONTENT_PLACEHOLDERS.md` if replacing a placeholder
