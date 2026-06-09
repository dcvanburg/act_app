# Safety screening — example questions

**Status:** EXAMPLES ONLY — DRAFT FOR THERAPIST REVIEW.
**Resolves:** Provisional answer to OPEN_QUESTIONS #11.
**Validation required:** A registered clinician (GZ-psycholoog, klinisch psycholoog, or huisarts) must validate every question, every answer option, every blocking rule, and the routing copy before any pilot user sees these.

---

## Why this file exists

The Next.js implementation shipped with `src/content/nl/intake.json` containing:

```json
"safetyCheck": {
  "title": "Veiligheidscheck",
  "description": "[PLACEHOLDER — screeningvragen in te vullen door therapeut]",
  "questions": []
}
```

That empty array is enforced as a build-time failure by `scripts/validate-content.ts` — onboarding cannot ship without screening questions. The clinician needs a starting point to react to, not a blank page. This file is that starting point.

## Provenance — these are NOT new clinical content

The example wording below is paraphrased from items in the public domain or in widely cited screening instruments used in Dutch primary mental health care:

- **PHQ-9 item 9** (Patient Health Questionnaire — depression) — suicidality screen, standard in NL huisarts/POH-GGZ practice
- **CSSRS** (Columbia Suicide Severity Rating Scale) — public-domain risk screen
- **AUDIT-C** (Alcohol Use Disorders Identification Test, short form) — WHO instrument, public
- General clinical-practice "have you a support network" framing — not from any single instrument

Nothing below should be considered novel ACT or therapeutic content. The clinician owns the final wording, the rating scale, and the blocking thresholds.

## Design goals

1. **Identify acute crisis** where self-guided digital ACT is clinically inappropriate
2. **Route to `/noodhulp`** — not "fail" the user
3. **Compassionate framing** — questions are an offer of care, not a gate to pass
4. **Brief** — 4-6 questions max; long screens drop completion rates in vulnerable users
5. **No prejudice** — answers are stored hashed/aggregated for safety routing only; raw answers are not part of `UserProgress` JSONB

## Routing semantics

After the user submits answers:

| Outcome | Trigger | UI |
|---------|---------|----|
| `pass` | No blocking answers | Continue to intake step 2 (complaint type) |
| `block-strong` | Q1 = "vaak" OR Q2 = "ja" OR Q3 = "ja" | Full-screen safetyBlock (`crisis.json` → `safetyBlock`), only `/noodhulp` action visible, program is NOT unlocked |
| `block-medical` | Q4 = "ja" | Full-screen safetyBlock variant: urge to contact huisarts / verslavingszorg before continuing |
| `flag` | Q1 = "soms" alone | Soft warning + offer of `/noodhulp` link, but program continues if user opts in |

`block-strong` and `block-medical` MUST persist on the user profile (`safetyCheckPassed = false`) so the program cannot be entered by direct URL.

## Example questions (Dutch, working draft)

> Therapist: edit wording freely. The IDs and the routing semantics above are what the code reacts to.

### Q1 — Recent suicidal ideation

```
id: suicidal-thoughts
title: De afgelopen twee weken — heb je gedachten gehad om jezelf iets aan te doen, of jezelf pijn te doen?
type: single-choice
options:
  - { value: never,     label: Nee, helemaal niet, blocking: pass }
  - { value: sometimes, label: Soms, blocking: flag }
  - { value: often,     label: Regelmatig of vaak, blocking: block-strong }
helpText: Je antwoord helpt ons inschatten of dit programma op dit moment passend is. We vragen het uit zorg, niet als test.
```

### Q2 — Active plan

```
id: active-plan
title: Heb je op dit moment een concreet plan om jezelf iets aan te doen?
type: single-choice
options:
  - { value: no,  label: Nee, blocking: pass }
  - { value: yes, label: Ja, blocking: block-strong }
helpText: Als je dit met "ja" beantwoordt, leiden we je direct naar hulp. Het programma kan op dit moment niet starten.
```

### Q3 — Recent self-harm

```
id: recent-self-harm
title: Heb je jezelf de afgelopen zeven dagen opzettelijk pijn gedaan?
type: single-choice
options:
  - { value: no,  label: Nee, blocking: pass }
  - { value: yes, label: Ja, blocking: block-strong }
helpText: Bij "ja" raden we eerst contact met een huisarts of de crisislijn aan.
```

### Q4 — Acute substance dependence

```
id: substance-acute
title: Drink je of gebruik je op dit moment zoveel dat stoppen zonder medische begeleiding gevaarlijk zou kunnen zijn?
type: single-choice
options:
  - { value: no,        label: Nee, blocking: pass }
  - { value: not-sure,  label: Ik weet het niet, blocking: flag }
  - { value: yes,       label: Ja, blocking: block-medical }
helpText: Een huisarts of de verslavingszorg kan je veilig helpen afbouwen — dat valt buiten wat deze app kan bieden.
```

### Q5 — Support network (context, non-blocking)

```
id: support-network
title: Heb je iemand in je omgeving (familie, vriend, professional) waar je in moeilijke momenten contact mee kunt opnemen?
type: single-choice
options:
  - { value: yes,        label: Ja, blocking: pass }
  - { value: sometimes,  label: Soms, blocking: pass }
  - { value: no,         label: Nee, blocking: pass }
helpText: We slaan dit op zodat we je een aangepaste lijst met hulpbronnen kunnen tonen. Het beïnvloedt niet of je het programma kunt starten.
```

## Open questions for the therapist

1. **Is 4 questions enough, or should we add a PHQ-2 / GAD-2 pre-screen** to better tier symptom severity before complaint selection?
2. **Q1 timeframe — "afgelopen twee weken" (PHQ-9 standard) or "afgelopen 30 dagen"?**
3. **Q4 — separate alcohol vs other substances?** Currently combined; combining keeps the screen short but loses specificity.
4. **Q3 timeframe — 7 days or 30 days?** 7 days is more conservative (catches active risk); 30 days is more inclusive (catches recent risk).
5. **Storage:** should raw answers be encrypted at rest with a per-user key, or is Supabase column-level encryption sufficient? Currently the design assumes only the outcome (`pass` / `flag` / `block-*`) is stored as a structured value; raw answer values are not retained.
6. **Re-screening:** if a user passed once, do we re-screen at any point (e.g., monthly, on module 4, when a mood entry indicates low mood)? Default proposal: re-screen if any mood log scores ≤ 2 for three consecutive days.

## Implementation notes (for α5)

- These questions are content, not code — they live in `src/content/nl/intake.json` under `safetyCheck.questions[]`.
- The `type: single-choice` shape needs a Zod schema. Add to `src/types/content.ts` during α5.
- The routing logic (`pass`, `flag`, `block-strong`, `block-medical`) lives in `src/lib/safety.ts` (new file in α5).
- The blocking outcomes must update `progress.safetyCheckPassed` and persist in `user_progress.progress` JSONB.
- The safetyBlock screen reuses `src/content/nl/crisis.json` → `safetyBlock`; add a `block-medical` variant in that file when ready.
- Test plan: every blocking answer combination must be covered by a unit test (`src/lib/__tests__/safety.test.ts`).

## Definition of done — clinical sign-off

A pilot cannot start until **all** of the following are signed off by the responsible clinician:

- [ ] Final question wording in Dutch
- [ ] Final answer options and their `blocking:` annotation
- [ ] Final routing copy in `crisis.json` → `safetyBlock` (current and `block-medical` variant)
- [ ] Re-screen policy
- [ ] Data retention policy for safety check answers
- [ ] Liability disclaimer reviewed by a Dutch healthcare-savvy lawyer (see OPEN_QUESTIONS #12)
- [ ] Removal of all `[PLACEHOLDER]` markers in safety paths verified by `npm run validate:content`
