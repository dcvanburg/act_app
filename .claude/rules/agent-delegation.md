# Agent Delegation

| Trigger | Agent | Action |
|---------|-------|--------|
| Module copy, placeholders, body transcripts, ACT review | `therapeut` | Dutch content to `src/content/nl/` |
| Feature touches 3+ files | `planner` | Plan only; no code |
| Feature complete | `code-reviewer` | Review diff |
| Auth, intake, journal, crisis, progress | `security-reviewer` | Security review |
| Build/type/lint failure | `build-fixer` | Fix errors |
| "How does X work?" | `explorer` | Read-only exploration |

After fixing a repeated agent mistake, update the relevant skill (recursive improvement).
