---
name: add-module-content
description: >-
  Adds or updates Dutch therapeutic content in src/content/nl/ from therapist input.
  Use when filling placeholders, adding audio URLs, or updating module copy.
  For full therapeutic workflow, prefer therapeut-content skill + therapeut agent.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Add Module Content

> Lightweight content insertion. For writing from scratch, use `therapeut-content` skill
> and the `therapeut` agent (voice guide, hexaflex map, complaint examples).

## Input

Therapist provides Dutch text for a module section, practical task, or exercise.

## Process

1. Read `.claude/skills/therapeut-content/voice-guide.md` if writing new copy
2. Open `src/content/nl/modules/<n>-<id>.json` or `src/content/nl/exercises/`
3. Replace `[PLACEHOLDER]` with final Dutch text — preserve therapist voice
4. Do not paraphrase from copyrighted ACT workbooks or Resiliens ACT Coach text
5. Update `docs/CONTENT_PLACEHOLDERS.md` — mark item complete
6. If audio provided: set `audioUrl` and `transcript`

## Validation

- Valid JSON
- Dutch only in content values
- No `—`, `–`, or `-` bullets in user-facing strings (see `voice-guide.md` § Interpunctie)
- `backReferences` labels match linked module titles
- Safety/crisis copy coordinated with `crisis.json` if relevant
