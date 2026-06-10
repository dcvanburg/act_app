# Therapeut Knowledge Base — Concept Summary

> Condensed from *ACT App Concept v1.0* (Dutch source document).
> English for agent planning; all user-facing output is Dutch.

## One-liner

Self-guided therapeutic program based on **Acceptance and Commitment Therapy (ACT)** and
**body-oriented psychosomatic therapy** — for chronic pain, mental health complaints, and
alcohol/substance-related difficulties.

## Vision

The app is **not** about eliminating symptoms. It is about building a life that feels
meaningful — even when pain remains, thoughts resist, or urges return.

This is **not a course**. It is a therapeutic process at the user's own pace, with the app
as guide.

## Core philosophy

| Principle (NL) | Meaning |
|----------------|---------|
| Klachten zijn niet de vijand — vermijding wel | Target avoidance patterns, not symptom suppression |
| Het lichaam is geen bijzaak — het is de poort | Body work integrated in every module |
| Waarden zijn de kompas, niet symptoomvrij zijn | Direction over cure |
| Terugval is informatie, geen mislukking | Non-punitive framing of setbacks |

## Target audiences (overlapping)

1. Chronic pain (physical and/or psychosomatic)
2. Mental health (anxiety, burnout, depression, stress)
3. Alcohol problems or other addiction-related complaints

Shared patterns: avoidance, need for control, disconnection from the body.
ACT provides a transdiagnostic framework for all three.

## Positioning

- Standalone therapeutic instrument — **not** replacement for therapy in severe pathology
- Effective for independent work or as supplement to professional guidance
- Differentiators: ACT backbone, integrated body work, non-linear freedom within linear
  structure, practice-based voice, broad yet personal

## Program structure

Three phases, **8 modules** (including onboarding). Linear progression; completed modules
revisitable.

| # | Module (NL) | ACT process | Body work |
|---|-------------|-------------|-----------|
| 0 | Welkom & Intake | Philosophy introduction | Body awareness intake |
| 1 | Herkennen | Psycho-education avoidance cycle | Body scan |
| 2 | Acceptatie | Making space, paradox of control | Breath space |
| 3 | Defusie | Distancing from thoughts | Tension & release |
| 4 | Aanwezig zijn | Mindfulness, the present | Sensory exercise |
| 5 | Zelf-als-context | Observing self | Centering |
| 6 | Waarden | Choosing direction despite pain | Heart-area exercise |
| 7 | Toegewijd handelen | Committed action toward values | Movement exercise |

Full per-module detail: `docs/MODULES.md`

## Navigation

- **Guided Path with Free Navigation** — linear unlock, free back-navigation to completed steps
- Back-references within modules to earlier steps
- Save and return without losing progress
- Daily practice unlocks after module 7
- **Noodknop** always reachable → grounding/breath exercise + `/noodhulp`

## Post-completion: Daily Practice

- Standalone exercises by theme
- Journal function
- Weekly values check-in
- Emergency button (always available)

## Safety & ethics boundaries

The app is **not** appropriate as sole support for:

- Acute suicidality or self-harm
- Severe psychiatric pathology
- Severe addiction without professional guidance

Referral resources (Dutch):

- Huisarts
- GGZ
- Crisislijn: **0800-0113**

Safety check at onboarding; crisis screen at `/noodhulp` (no auth required).

## Content status

Practical tasks per module are `[PLACEHOLDER]` in v1 — track in
`docs/CONTENT_PLACEHOLDERS.md`.

## Copyright (from concept doc)

- ACT as method: not copyright-protected
- All content: therapist's own words
- Classic ACT metaphors: common knowledge but always paraphrase
- Custom exercises and texts: therapist-owned
- Legal review advised before public launch

## App content locations

| Area | Path |
|------|------|
| Module copy | `src/content/nl/modules/` |
| Crisis | `src/content/nl/crisis.json` |
| Intake | `src/content/nl/intake.json` |
| Mood | `src/content/nl/mood.json` |
| Daily practice | `src/content/nl/daily-practice.json` |
| Emergency exercise | `src/content/nl/exercises/emergency-grounding.json` |
