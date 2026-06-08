---
name: scaffold-feature
description: >-
  Scaffolds a feature from docs/ specs for act_app. Reads PRODUCT, TECHNICAL_SPEC,
  and MODULES before implementing. Use when adding routes, components, or module flows.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# Scaffold Feature

## Before coding

1. Read `docs/TECHNICAL_SPEC.md` and relevant module in `docs/MODULES.md`
2. Check `docs/OPEN_QUESTIONS.md` — stop if decision blocks implementation
3. Confirm Dutch content exists or add placeholders to `src/content/nl/`

## Process

1. Plan files to create/modify (minimal scope)
2. English code; Dutch strings from content JSON
3. Wire navigation per `docs/NAVIGATION.md`
4. Include emergency button in layout if adding a new screen template
5. Run verification-loop when done

## Module features

- Unlock: module N after N-1 `completed`
- Save `lastStepId` for resume
- Back-references from module JSON `backReferences` array
- Body exercise: audio URL + transcript fields (nullable until therapist provides)
