# Product Specification — Van Overleven naar Leven

> Source: ACT App Concept v1.0 (Dutch). UI and user-facing content: **Dutch**. Codebase and dev docs: **English**.

## One-liner

A self-guided therapeutic program based on Acceptance and Commitment Therapy (ACT) and body-oriented psychosomatic therapy — for people with mental health complaints, chronic pain, and alcohol/substance-related difficulties.

## Vision & Philosophy

The app is **not** about eliminating symptoms. It is about building a life that feels meaningful — even when pain remains, thoughts resist, or urges return.

This is **not a course**. It is a therapeutic process the user completes at their own pace, with the app as guide.

### Core philosophy

| Principle                                       | Meaning                                            |
| ----------------------------------------------- | -------------------------------------------------- |
| Symptoms are not the enemy — avoidance is       | Target avoidance patterns, not symptom suppression |
| The body is not secondary — it is the gateway   | Body work integrated in every module               |
| Values are the compass, not symptom-free living | Direction over cure                                |
| Relapse is information, not failure             | Non-punitive framing of setbacks                   |

## Target audiences (overlapping)

1. People with chronic pain (physical and/or psychosomatic)
2. People with mental health complaints (anxiety, burnout, depression, stress)
3. People with alcohol problems or other addiction-related complaints

Shared underlying patterns: avoidance, need for control, disconnection from the body. ACT provides a transdiagnostic framework for all three.

## Positioning

- **Standalone therapeutic instrument** — not a replacement for therapy in severe pathology
- Effective for people who want to work independently, or as a supplement to professional guidance
- **Differentiators:** ACT backbone, integrated body work, non-linear freedom within linear structure, practice-based voice, broad yet personal

## Program structure

Three phases, **8 modules** (including onboarding). Linear progression with free back-navigation to completed steps.

| #   | Module (NL)        | ACT process                      | Body work             |
| --- | ------------------ | -------------------------------- | --------------------- |
| 0   | Onboarding         | Philosophy introduction          | Body awareness intake |
| 1   | Herkennen          | Psycho-education avoidance cycle | Body scan             |
| 2   | Acceptatie         | Making space, paradox of control | Breath space          |
| 3   | Defusie            | Distancing from thoughts         | Tension & release     |
| 4   | Aanwezig zijn      | Mindfulness, the present         | Sensory exercise      |
| 5   | Zelf-als-context   | Observing self                   | Centering             |
| 6   | Waarden            | Choosing direction despite pain  | Heart-area exercise   |
| 7   | Toegewijd handelen | Committed action toward values   | Movement exercise     |

See [MODULES.md](./MODULES.md) for full per-module detail.

## Navigation model: Guided Path with Free Navigation

- **Linear path** — each module builds on the previous
- **Back-references** — contextual links to earlier steps within modules
- **Save and return** — pause without losing progress
- **Unlock after completion** — full program unlocks standalone exercises
- **Emergency button** — always reachable; direct link to breath/grounding exercise

## Post-completion: Daily Practice

After Module 7:

- Standalone exercises by theme
- Journal function
- Weekly values check-in
- Emergency button (always available)

## Content status

Practical tasks per module are **PLACEHOLDER** in v1 concept — to be filled by the therapist. Track in [CONTENT_PLACEHOLDERS.md](./CONTENT_PLACEHOLDERS.md).

## Chatbot (under design — see [ADR-005](./ADR/005-rag-chatbot.md))

A scoped Q&A chatbot is in design for v1: it answers user questions using **only therapist-approved Dutch content** that has been ingested into a Supabase vector index. The chatbot:

- Is **not** a therapeutic agent. It does not give clinical advice, diagnoses, or new exercises.
- Synthesises short Dutch summaries from the therapist's own module copy, exercises, and psycho-education.
- Refers users to huisarts, GGZ, or the crisis line for anything outside that scope.
- Defers to `/noodhulp` immediately on any crisis signal (keyword pre-filter) — the LLM is never consulted for those messages.

Therapist sign-off is required on the system prompt and every ingested document before pilot. See OPEN_QUESTIONS #19–24.

## Copyright note (from concept doc)

- ACT as a method is not copyright-protected
- All content must be written in the therapist's own words
- Classic ACT metaphors are common knowledge but should be paraphrased
- Custom exercises and texts belong to the therapist
- Legal review advised before public launch

## Open product decisions

See [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) for items requiring stakeholder input.
