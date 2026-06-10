---
name: therapeut-content
description: >-
  Write and review Dutch therapeutic content for Van Overleven naar Leven.
  Use when filling module placeholders, body-exercise transcripts, intake/safety
  copy, daily-practice prompts, or reviewing ACT consistency.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Therapeut Content Skill

## When to use

- Filling `[PLACEHOLDER]` in `src/content/nl/`
- Writing guided body-exercise transcripts
- Drafting intake/safety screening (DRAFT only)
- Reviewing module copy for ACT + psychosomatic consistency
- Mood journal prompts, weekly values check-in copy

## Knowledge base (read first)

| File                                                     | Purpose                                        |
| -------------------------------------------------------- | ---------------------------------------------- |
| `docs/THERAPEUT_KB/concept-summary.md`                   | Vision, modules, safety boundaries             |
| `docs/THERAPEUT_KB/resiliens-act-coach-notes.md`         | Hexaflex mapping + ACT Coach feature reference |
| `.claude/skills/therapeut-content/voice-guide.md`        | Dutch tone and style                           |
| `.claude/skills/therapeut-content/hexaflex-map.md`       | Module ↔ ACT process ↔ body work               |
| `.claude/skills/therapeut-content/complaint-examples.md` | Example angles per complaint type              |

## Workflow A — Module section

1. Read `docs/MODULES.md` for the target module
2. Open `src/content/nl/modules/<n>-<id>.json`
3. Read `voice-guide.md` and `hexaflex-map.md`
4. Write Dutch `body` text (2–4 short paragraphs, mobile-friendly)
5. If section has `examples`, fill all four keys: `pain`, `mental`, `alcohol`, `combination`
6. Keep `backReferences` labels aligned with linked module titles
7. Update `docs/CONTENT_PLACEHOLDERS.md` — mark complete
8. Verify valid JSON; suggest `npm run validate:content`

## Workflow B — Body exercise transcript

1. Read module `bodyExercise` block in the JSON file
2. Write a guided script in Dutch, second person singular (`je`)
3. Target length: 5–12 minutes spoken (~750–1500 words)
4. Use pause markers: `[pauze 3 sec]`, `[pauze 5 sec]`
5. End with gentle return to the room; no abrupt stop
6. Set `transcript` field; leave `audioUrl: null` until recorded
7. Update `docs/CONTENT_PLACEHOLDERS.md` audio row

## Workflow C — Practical task (`practicalTask`)

1. One clear, doable assignment (10–20 min)
2. Links cognitive section to body exercise where possible
3. No homework that requires another person unless optional
4. Frame as experiment, not test: "Merk op…", "Probeer…", "Schrijf op…"

## Workflow D — Safety & intake (DRAFT)

1. Read `docs/SAFETY_SCREENING_EXAMPLES.md` and `docs/SECURITY.md`
2. Propose 4–6 questions in `src/content/nl/intake.json`
3. Prefix every proposal with comment in deliverable: **DRAFT — klinische goedkeuring vereist**
4. Acute signals route to `/noodhulp` — never block without resources
5. **Always** recommend `security-reviewer` after changes

## Workflow E — Content review

Run this checklist; report PASS or NEEDS REVISION:

- [ ] Matches hexaflex process for this module
- [ ] Body work connected to cognitive content
- [ ] No promise of cure or symptom elimination
- [ ] Values-as-compass framing preserved
- [ ] Appropriate for pain + mental + addiction audiences
- [ ] Dutch only; no English user strings
- [ ] No copied text from Resiliens or copyrighted workbooks
- [ ] Crisis/disclaimer language not weakened
- [ ] Paragraphs short enough for mobile reading

## Content file map

| Content            | Path                                                |
| ------------------ | --------------------------------------------------- |
| Modules 0–7        | `src/content/nl/modules/<n>-<id>.json`              |
| Crisis             | `src/content/nl/crisis.json`                        |
| Intake + safety    | `src/content/nl/intake.json`                        |
| Emergency exercise | `src/content/nl/exercises/emergency-grounding.json` |
| Daily practice     | `src/content/nl/daily-practice.json`                |
| Mood               | `src/content/nl/mood.json`                          |
| Shared UI strings  | `src/content/nl/common.json`                        |

## Punctuation (mandatory)

- No em dash (`—`), en dash (`–`), or hyphen as clause separator in Dutch user copy
- Replace with period, comma, colon, or rephrase
- Bullet lists: `•` or `1.` — never markdown `-` bullets in JSON strings
- See `voice-guide.md` § Interpunctie

## Copyright

- ACT as method: not copyright-protected
- All app copy: therapist's own words
- Classic metaphors (passengers on the bus, etc.): always paraphrase
- Resiliens ACT Coach: methodology reference only — [link](https://www.resiliens.com/nl/act-coach)

## Recommended content order

1. `crisis.json` + intake disclaimer (with security review)
2. Module 0 (onboarding + safety check)
3. Module 1 (avoidance cycle — foundation)
4. Modules 2–7 in order
5. Emergency grounding + daily practice
