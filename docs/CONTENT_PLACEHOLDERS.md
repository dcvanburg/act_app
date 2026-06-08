# Content Placeholders — Therapist Input Required

> All items below are marked `[PLACEHOLDER]` in the concept document. Fill before public launch.

## Per-module practical tasks

| Module | Dutch title | Placeholder field | Status |
|--------|-------------|-------------------|--------|
| 0 | Welkom & Intake | Praktische taak | ⬜ Not started |
| 1 | Herkennen | Praktische taak | ⬜ Not started |
| 2 | Acceptatie | Praktische taak | ⬜ Not started |
| 3 | Defusie | Praktische taak | ⬜ Not started |
| 4 | Aanwezig zijn | Praktische taak | ⬜ Not started |
| 5 | Zelf-als-context | Praktische taak | ⬜ Not started |
| 6 | Waarden | Praktische taak | ⬜ Not started |
| 7 | Toegewijd handelen | Praktische taak | ⬜ Not started |

## Safety & intake

| Item | Description | Status |
|------|-------------|--------|
| Safety screening questions | Questions that trigger crisis referral | ⬜ Not started |
| Crisis screen copy | Full Dutch text for `/noodhulp` | ⬜ Not started |
| Onboarding disclaimer | Legal/ethical boundaries text | ⬜ Not started |

## Body work & audio

| Module | Exercise | Audio recorded? | Transcript? |
|--------|----------|-----------------|-------------|
| 0 | Body awareness intake | ⬜ | ⬜ |
| 1 | Body scan | ⬜ | ⬜ |
| 2 | Breath space | ⬜ | ⬜ |
| 3 | Tension & release | ⬜ | ⬜ |
| 4 | Sensory exercise | ⬜ | ⬜ |
| 5 | Centering | ⬜ | ⬜ |
| 6 | Heart-area exercise | ⬜ | ⬜ |
| 7 | Movement exercise | ⬜ | ⬜ |
| Emergency | Grounding/breath | ⬜ | ⬜ |

## Daily practice (post-completion)

| Item | Status |
|------|--------|
| Standalone exercise library (per theme) | ⬜ Not started |
| Journal prompts (optional) | ⬜ Not started |
| Weekly check-in questions | ⬜ Not started |

## Conditional examples (per complaint type)

Each module may have 1–2 sections with complaint-specific example paragraphs. The therapist writes one example per complaint type (`pain`, `mental`, `alcohol`, `combination`) for each applicable section.

**Format in JSON:**
```json
"examples": {
  "pain":        "[PLACEHOLDER — voorbeeld bij chronische pijn]",
  "mental":      "[PLACEHOLDER — voorbeeld bij angst/burn-out/depressie]",
  "alcohol":     "[PLACEHOLDER — voorbeeld bij verslavingsklachten]",
  "combination": "[PLACEHOLDER — voorbeeld bij combinatie van klachten]"
}
```

| Module | Section(s) that need examples | Status |
|--------|-------------------------------|--------|
| 1 Herkennen | `avoidance-cycle` | ⬜ Not started |
| 2 Acceptatie | `avoidance-cycle` reference | ⬜ Not started |
| 3 Defusie | `how-it-works` | ⬜ Not started |
| 4 Aanwezig zijn | `how-it-works` | ⬜ Not started |
| 5 Zelf-als-context | `how-it-works` | ⬜ Not started |
| 6 Waarden | `how-it-works` | ⬜ Not started |
| 7 Toegewijd handelen | `how-it-works` | ⬜ Not started |

> Exact sections to receive examples are TBD — therapist decides which sections benefit from personalization.

## Personalization

| Item | Status |
|------|--------|
| Back-reference link labels per module | ⬜ Not started |

## How to submit content

1. Add Dutch text to `src/content/nl/modules/<id>.json` (once scaffold exists)
2. Or provide Word/Google Doc to developer for import
3. Mark row ✅ in this file when complete
