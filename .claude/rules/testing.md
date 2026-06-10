---
paths:
  - '**/*.{test,spec}.{ts,tsx}'
---

# Testing

- Test module unlock logic thoroughly (edge cases: replay, partial progress)
- Test safety check blocks progression when triggered
- Test emergency button renders on all layout templates
- Dutch content: snapshot or key presence tests for critical flows
- Do not test implementation details; test user-visible behavior
