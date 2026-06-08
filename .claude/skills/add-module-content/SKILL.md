---
name: add-module-content
description: >-
  Adds or updates Dutch therapeutic content in src/content/nl/ from therapist input.
  Use when filling placeholders, adding audio URLs, or updating module copy.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Add Module Content

## Input

Therapist provides Dutch text for a module section, practical task, or exercise.

## Process

1. Open `src/content/nl/modules/<n>-<id>.json` or `src/content/nl/exercises/`
2. Replace `[PLACEHOLDER]` with final Dutch text — preserve therapist voice
3. Do not paraphrase from copyrighted ACT workbooks
4. Update `docs/CONTENT_PLACEHOLDERS.md` — mark item complete
5. If audio provided: set `audioUrl` and `transcript`

## Validation

- Valid JSON
- Dutch only in content values
- `backReferences` labels match linked module titles
- Safety/crisis copy coordinated with `crisis.json` if relevant
