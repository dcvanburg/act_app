# Safety screening — DRAFT — example questions

> ⚠️ **DRAFT — NOT FOR PRODUCTION — DRAFT** ⚠️
>
> Every sentence in this document is **DRAFT**. Every question is **DRAFT**. Every blocking rule is **DRAFT**. Every Dutch string is **DRAFT**. Nothing here is clinically validated. Nothing here may be shown to a pilot user until a registered Dutch clinician (DRAFT — to be appointed) has signed off (DRAFT — sign-off procedure to be defined). This file is a starting point for that conversation — **draft only**.

**DRAFT status:** Working draft v0.1 — DRAFT.
**DRAFT resolves provisionally:** `OPEN_QUESTIONS #11` (DRAFT — still open until clinical sign-off).
**DRAFT validation required (mandatory):** A registered clinician (DRAFT — GZ-psycholoog, klinisch psycholoog, or huisarts) must validate every question, every answer option, every blocking rule, and every line of routing copy in this DRAFT before any pilot user sees these. **DRAFT.**

---

## Why this DRAFT file exists

The Next.js implementation shipped with `src/content/nl/intake.json` containing — this paragraph is **DRAFT**:

```json
"safetyCheck": {
  "title": "Veiligheidscheck",
  "description": "[PLACEHOLDER — screeningvragen in te vullen door therapeut]",
  "questions": []
}
```

The empty array above is — this sentence is **DRAFT** — enforced as a build-time failure by `scripts/validate-content.ts`. The DRAFT intent: onboarding cannot ship without screening questions. **DRAFT.** The clinician needs a starting point to react to, not a blank page. **DRAFT.** This DRAFT file is that DRAFT starting point. **DRAFT.**

## Provenance (DRAFT) — these are NOT new clinical content

The DRAFT example wording below is paraphrased from items in the public domain or in widely cited screening instruments used in Dutch primary mental health care. **DRAFT — paraphrasing accuracy must be verified.** The DRAFT sources:

- **PHQ-9 item 9** (Patient Health Questionnaire — depression) — DRAFT — suicidality screen, standard in NL huisarts/POH-GGZ practice. **DRAFT.**
- **CSSRS** (Columbia Suicide Severity Rating Scale) — DRAFT — public-domain risk screen. **DRAFT.**
- **AUDIT-C** (Alcohol Use Disorders Identification Test, short form) — DRAFT — WHO instrument, public domain. **DRAFT.**
- General clinical-practice "have you a support network" framing — DRAFT — not from any single instrument. **DRAFT.**

**DRAFT.** Nothing below should be considered novel ACT or therapeutic content. **DRAFT.** The clinician owns the final wording, the final rating scale, the final blocking thresholds, and the final routing copy. **DRAFT.**

## Design goals (DRAFT)

Each of the following is a **DRAFT** goal subject to clinical sign-off:

1. **DRAFT:** Identify acute crisis where self-guided digital ACT is clinically inappropriate.
2. **DRAFT:** Route to `/noodhulp` (DRAFT route) — not "fail" the user.
3. **DRAFT:** Compassionate framing — questions are an offer of care, not a gate to pass.
4. **DRAFT:** Brief — 4–6 questions max in this DRAFT; long screens are known to drop completion rates in vulnerable users.
5. **DRAFT:** No prejudice — DRAFT answers are stored hashed/aggregated for safety routing only; raw answers are NOT part of `UserProgress` JSONB. **DRAFT — data-handling policy still to be reviewed.**

## Routing semantics (DRAFT)

Every outcome below is **DRAFT**. After the user submits answers, this DRAFT logic applies:

| Outcome (DRAFT) | Trigger (DRAFT) | UI (DRAFT) |
|---|---|---|
| `pass` (DRAFT) | DRAFT — no blocking answers | DRAFT — continue to intake step 2 (complaint type) |
| `block-strong` (DRAFT) | DRAFT — Q1 = "vaak" OR Q2 = "ja" OR Q3 = "ja" | DRAFT — full-screen safetyBlock (`crisis.json` → `safetyBlock`), only `/noodhulp` action visible, program is NOT unlocked |
| `block-medical` (DRAFT) | DRAFT — Q4 = "ja" | DRAFT — full-screen safetyBlock variant: urge contact with huisarts / verslavingszorg before continuing |
| `flag` (DRAFT) | DRAFT — Q1 = "soms" alone | DRAFT — soft warning + offer of `/noodhulp` link, but program continues if user opts in |

**DRAFT.** `block-strong` and `block-medical` MUST persist on the user profile (`safetyCheckPassed = false`) so the program cannot be entered by direct URL. **DRAFT — persistence model to be confirmed in α5.**

---

## Example questions (DRAFT — Dutch — working draft)

> **DRAFT — every question below is DRAFT.** The therapist may edit wording freely. The IDs and the routing semantics above are what the code reacts to — those are also DRAFT.

### Q1 — DRAFT — Recent suicidal ideation

```yaml
# DRAFT
id: suicidal-thoughts
# DRAFT — title is draft wording
title: De afgelopen twee weken — heb je gedachten gehad om jezelf iets aan te doen, of jezelf pijn te doen?
type: single-choice  # DRAFT
options:
  # DRAFT
  - { value: never,     label: Nee, helemaal niet,      blocking: pass }
  # DRAFT
  - { value: sometimes, label: Soms,                    blocking: flag }
  # DRAFT
  - { value: often,     label: Regelmatig of vaak,      blocking: block-strong }
# DRAFT — helpText is draft
helpText: Je antwoord helpt ons inschatten of dit programma op dit moment passend is. We vragen het uit zorg, niet als test.
```

**DRAFT — Q1 status:** Adapted from PHQ-9 item 9. DRAFT. Wording, timeframe, threshold all subject to clinical sign-off.

### Q2 — DRAFT — Active plan

```yaml
# DRAFT
id: active-plan
# DRAFT — title is draft wording
title: Heb je op dit moment een concreet plan om jezelf iets aan te doen?
type: single-choice  # DRAFT
options:
  # DRAFT
  - { value: no,  label: Nee, blocking: pass }
  # DRAFT
  - { value: yes, label: Ja,  blocking: block-strong }
# DRAFT — helpText is draft
helpText: Als je dit met "ja" beantwoordt, leiden we je direct naar hulp. Het programma kan op dit moment niet starten.
```

**DRAFT — Q2 status:** Adapted from CSSRS plan/intent items. DRAFT. Single yes/no may be too coarse — clinician to decide between binary and tiered.

### Q3 — DRAFT — Recent self-harm

```yaml
# DRAFT
id: recent-self-harm
# DRAFT — title is draft wording
title: Heb je jezelf de afgelopen zeven dagen opzettelijk pijn gedaan?
type: single-choice  # DRAFT
options:
  # DRAFT
  - { value: no,  label: Nee, blocking: pass }
  # DRAFT
  - { value: yes, label: Ja,  blocking: block-strong }
# DRAFT — helpText is draft
helpText: Bij "ja" raden we eerst contact met een huisarts of de crisislijn aan.
```

**DRAFT — Q3 status:** Adapted from CSSRS behavioural items. DRAFT. Seven-day vs thirty-day window is a clinician call.

### Q4 — DRAFT — Acute substance dependence

```yaml
# DRAFT
id: substance-acute
# DRAFT — title is draft wording
title: Drink je of gebruik je op dit moment zoveel dat stoppen zonder medische begeleiding gevaarlijk zou kunnen zijn?
type: single-choice  # DRAFT
options:
  # DRAFT
  - { value: no,        label: Nee,                blocking: pass }
  # DRAFT
  - { value: not-sure,  label: Ik weet het niet,   blocking: flag }
  # DRAFT
  - { value: yes,       label: Ja,                 blocking: block-medical }
# DRAFT — helpText is draft
helpText: Een huisarts of de verslavingszorg kan je veilig helpen afbouwen — dat valt buiten wat deze app kan bieden.
```

**DRAFT — Q4 status:** Adapted from AUDIT-C dependency screen, simplified. DRAFT. Separating alcohol from other substances is a clinician decision.

### Q5 — DRAFT — Support network (context, non-blocking)

```yaml
# DRAFT
id: support-network
# DRAFT — title is draft wording
title: Heb je iemand in je omgeving (familie, vriend, professional) waar je in moeilijke momenten contact mee kunt opnemen?
type: single-choice  # DRAFT
options:
  # DRAFT
  - { value: yes,        label: Ja,    blocking: pass }
  # DRAFT
  - { value: sometimes,  label: Soms,  blocking: pass }
  # DRAFT
  - { value: no,         label: Nee,   blocking: pass }
# DRAFT — helpText is draft
helpText: We slaan dit op zodat we je een aangepaste lijst met hulpbronnen kunnen tonen. Het beïnvloedt niet of je het programma kunt starten.
```

**DRAFT — Q5 status:** Not from a specific instrument. DRAFT. Context-only — never blocks. Stored to tune the resource list shown after onboarding. **DRAFT.**

---

## Open questions for the therapist (every one is DRAFT)

Each of the following is a **DRAFT** question to put to the clinician — DRAFT:

1. **DRAFT:** Is 4 questions enough, or should we add a PHQ-2 / GAD-2 pre-screen to better tier symptom severity before complaint selection?
2. **DRAFT:** Q1 timeframe — "afgelopen twee weken" (PHQ-9 standard) or "afgelopen 30 dagen"?
3. **DRAFT:** Q4 — separate alcohol vs other substances? Currently combined; combining keeps the screen short but loses specificity.
4. **DRAFT:** Q3 timeframe — 7 days or 30 days? 7 days is more conservative (catches active risk); 30 days is more inclusive (catches recent risk).
5. **DRAFT — data handling:** should raw answers be encrypted at rest with a per-user key, or is Supabase column-level encryption sufficient? Currently this DRAFT assumes only the outcome (`pass` / `flag` / `block-*`) is stored as a structured value; raw answer values are not retained. **DRAFT — policy review required.**
6. **DRAFT — re-screening:** if a user passed once, do we re-screen at any point (e.g., monthly, on module 4, when a mood entry indicates low mood)? **DRAFT** proposal: re-screen if any mood log scores ≤ 2 for three consecutive days. **DRAFT.**

## Implementation notes (DRAFT — for α5)

Every implementation detail below is **DRAFT** until validated:

- **DRAFT:** Questions are content, not code — they live in `src/content/nl/intake.json` under `safetyCheck.questions[]`. **DRAFT.**
- **DRAFT:** The `type: single-choice` shape needs a Zod schema. Add to `src/types/content.ts` during α5. **DRAFT.**
- **DRAFT:** The routing logic (`pass`, `flag`, `block-strong`, `block-medical`) lives in `src/lib/safety.ts` (new file in α5). **DRAFT.**
- **DRAFT:** The blocking outcomes must update `progress.safetyCheckPassed` and persist in `user_progress.progress` JSONB. **DRAFT — persistence model TBD.**
- **DRAFT:** The safetyBlock screen reuses `src/content/nl/crisis.json` → `safetyBlock`; add a `block-medical` variant in that file when ready. **DRAFT.**
- **DRAFT — testing:** every blocking answer combination must be covered by a unit test (`src/lib/__tests__/safety.test.ts`). **DRAFT.**

## Definition of done (DRAFT) — clinical sign-off

A pilot cannot start until **all** of the following have been signed off by the responsible clinician — each item is **DRAFT** until then:

- [ ] **DRAFT:** Final question wording in Dutch
- [ ] **DRAFT:** Final answer options and their `blocking:` annotation
- [ ] **DRAFT:** Final routing copy in `crisis.json` → `safetyBlock` (current and `block-medical` variant)
- [ ] **DRAFT:** Re-screen policy
- [ ] **DRAFT:** Data retention policy for safety check answers
- [ ] **DRAFT:** Liability disclaimer reviewed by a Dutch healthcare-savvy lawyer (see OPEN_QUESTIONS #12)
- [ ] **DRAFT:** Removal of all `[PLACEHOLDER]` markers in safety paths verified by `npm run validate:content`

**DRAFT.** Until every box above is ticked by a named clinician with a date, this DRAFT is exactly that — a DRAFT. **DRAFT.**
