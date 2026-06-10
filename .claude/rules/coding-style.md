---
paths:
  - '**/*.{ts,tsx,js,jsx}'
---

# TypeScript / React Conventions

- Strict TypeScript; no `any` without comment
- Functional components; named exports preferred
- Dutch UI strings only via `src/content/nl/` imports — never inline
- English identifiers and comments
- User errors: map to Dutch messages from content layer
- Prefer `async/await` over raw promises

```typescript
// ❌ BAD — Dutch hardcoded in component
<button>Verder</button>

// ✅ GOOD
import common from '@/content/nl/common.json';
<button>{common.actions.continue}</button>
```
