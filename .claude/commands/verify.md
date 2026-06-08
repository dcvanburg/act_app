---
description: Run full verification loop before PR
allowed-tools: Read, Grep, Glob, Bash
---

Run the verification-loop skill. Execute all phases and produce the report table.
If npm scripts do not exist yet, mark Build/Types/Lint/Tests as N/A and still run Security + Diff phases.
