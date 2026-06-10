# Content Placeholders — Therapist Input Required

> Updated 2026-06-09 by `therapeut` agent. Module copy, transcripts, and practical tasks filled.
> **Still requires clinical sign-off:** intake safety screening (DRAFT).

## Per-module practical tasks

| Module | Dutch title | Placeholder field | Status |
|--------|-------------|-------------------|--------|
| 0 | Welkom & Intake | Praktische taak | ✅ Filled |
| 1 | Herkennen | Praktische taak | ✅ Filled |
| 2 | Acceptatie | Praktische taak | ✅ Filled |
| 3 | Defusie | Praktische taak | ✅ Filled |
| 4 | Aanwezig zijn | Praktische taak | ✅ Filled |
| 5 | Zelf-als-context | Praktische taak | ✅ Filled |
| 6 | Waarden | Praktische taak | ✅ Filled |
| 7 | Toegewijd handelen | Praktische taak | ✅ Filled |

## Safety & intake

| Item | Description | Status |
|------|-------------|--------|
| Safety screening questions | Questions that trigger crisis referral | ⚠️ DRAFT — questions in `intake.json`; clinical sign-off required |
| Crisis screen copy | Full Dutch text for `/noodhulp` | ✅ Complete (`crisis.json`) |
| Onboarding disclaimer | Legal/ethical boundaries text | ✅ In `crisis.json` disclaimer + intake blocked messages |

## Body work & audio

| Module | Exercise | Audio recorded? | Transcript? |
|--------|----------|-----------------|-------------|
| 0 | Body awareness intake | ⬜ | ✅ |
| 1 | Body scan | ⬜ | ✅ |
| 2 | Breath space | ⬜ | ✅ |
| 3 | Tension & release | ⬜ | ✅ |
| 4 | Sensory exercise | ⬜ | ✅ |
| 5 | Centering | ⬜ | ✅ |
| 6 | Heart-area exercise | ⬜ | ✅ |
| 7 | Movement exercise | ⬜ | ✅ |
| Emergency | Grounding/breath | ⬜ | ✅ |

## Daily practice (post-completion)

| Item | Status |
|------|--------|
| Standalone exercise library (per theme) | ✅ Placeholder copy filled (`daily-practice.json`) |
| Journal prompts (optional) | ✅ Placeholder copy filled |
| Weekly check-in questions | ✅ Placeholder copy filled |

## Conditional examples (per complaint type)

| Module | Section(s) with examples | Status |
|--------|--------------------------|--------|
| 1 Herkennen | `avoidance-cycle` | ✅ Filled |
| 2 Acceptatie | `paradox` | ✅ Filled |
| 3 Defusie | `fused-vs-observer` | ✅ Filled |
| 4 Aanwezig zijn | `present-moment` | ✅ Filled |
| 5 Zelf-als-context | `not-the-complaint` | ✅ Filled |
| 6 Waarden | `directions-not-goals` | ✅ Filled |
| 7 Toegewijd handelen | `small-steps` | ✅ Filled |

## Personalization

| Item | Status |
|------|--------|
| Back-reference link labels per module | ✅ Already set in module JSON |

## Therapist review still needed

1. **Clinical sign-off** on intake safety questions (`intake.json` — `draftNotice` remains)
2. **Voice review** — does the Dutch copy match your therapeutic voice?
3. **Audio recording** — transcripts ready; `audioUrl` still `null` on all exercises
4. **Legal review** before public launch (copyright note in concept doc)

## How to submit revisions

1. Edit Dutch text in `src/content/nl/modules/<id>.json` or use `/therapeut`
2. Mark changes in this file
3. Run `npm run validate:content` before PR
