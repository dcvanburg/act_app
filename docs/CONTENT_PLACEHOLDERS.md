# Content Placeholders — Therapist Input Required

> Updated 2026-06-09 by `therapeut` agent. Module copy, transcripts, and practical tasks filled.
> **Still requires clinical sign-off:** intake safety screening (DRAFT).

## Per-module practical tasks

| Module | Dutch title        | Placeholder field | Status    |
| ------ | ------------------ | ----------------- | --------- |
| 0      | Welkom & Intake    | Praktische taak   | ✅ Filled |
| 1      | Herkennen          | Praktische taak   | ✅ Filled — v1.1 expansion 2026-06-13 (5 sections, expanded bodyscan, two-part task) |
| 2      | Acceptatie         | Praktische taak   | ✅ Filled |
| 3      | Defusie            | Praktische taak   | ✅ Filled |
| 4      | Aanwezig zijn      | Praktische taak   | ✅ Filled |
| 5      | Zelf-als-context   | Praktische taak   | ✅ Filled |
| 6      | Waarden            | Praktische taak   | ✅ Filled |
| 7      | Toegewijd handelen | Praktische taak   | ✅ Filled |

## Safety & intake

| Item                       | Description                            | Status                                                            |
| -------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Safety screening questions | Questions that trigger crisis referral | ⚠️ DRAFT — questions in `intake.json`; clinical sign-off required |
| Crisis screen copy         | Full Dutch text for `/noodhulp`        | ✅ Complete (`crisis.json`)                                       |
| Onboarding disclaimer      | Legal/ethical boundaries text          | ✅ In `crisis.json` disclaimer + intake blocked messages          |

## Body work & audio

| Module    | Exercise              | Audio recorded? | Transcript? |
| --------- | --------------------- | --------------- | ----------- |
| 0         | Body awareness intake | ⬜              | ✅          |
| 1         | Body scan             | ⬜              | ✅          |
| 2         | Breath space          | ⬜              | ✅          |
| 3         | Tension & release     | ⬜              | ✅          |
| 4         | Sensory exercise      | ⬜              | ✅          |
| 5         | Centering             | ⬜              | ✅          |
| 6         | Heart-area exercise   | ⬜              | ✅          |
| 7         | Movement exercise     | ⬜              | ✅          |
| Emergency | Grounding/breath      | ⬜              | ✅          |

## Daily practice (post-completion)

| Item                                    | Status                                             |
| --------------------------------------- | -------------------------------------------------- |
| Standalone exercise library (per theme) | ✅ Placeholder copy filled (`daily-practice.json`) |
| Journal prompts (optional)              | ✅ Placeholder copy filled                         |
| Weekly check-in questions               | ✅ Placeholder copy filled                         |

## Conditional examples (per complaint type)

| Module               | Section(s) with examples | Status    |
| -------------------- | ------------------------ | --------- |
| 1 Herkennen          | `avoidance-cycle`        | ✅ Filled |
| 2 Acceptatie         | `paradox`                | ✅ Filled |
| 3 Defusie            | `fused-vs-observer`      | ✅ Filled |
| 4 Aanwezig zijn      | `present-moment`         | ✅ Filled |
| 5 Zelf-als-context   | `not-the-complaint`      | ✅ Filled |
| 6 Waarden            | `directions-not-goals`   | ✅ Filled |
| 7 Toegewijd handelen | `small-steps`            | ✅ Filled |

## Personalization

| Item                                  | Status                        |
| ------------------------------------- | ----------------------------- |
| Back-reference link labels per module | ✅ Already set in module JSON |

## RAG chatbot (under design — see [ADR-005](./ADR/005-rag-chatbot.md))

The chatbot reuses existing module copy, exercises, and psycho-education — no new therapeutic content is required for retrieval itself. Four new artefacts need therapist input before pilot. Three are now approved; the ingest manifest is assembled in Phase 4.

| Artefact                                | Description                                                                                                                                                                                                              | Status                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Dutch system prompt                     | The instructions Claude Haiku receives on every chat call. Must align with [crisis.json](../src/content/nl/crisis.json) wording, ACT philosophy, and the "not a clinician" boundary.                                      | ✅ APPROVED v1.1 2026-06-13 (warmer ACT-begeleider tone) · Previous: v1.0 2026-06-12 — see [chatbot-drafts.md § 4a](./THERAPEUT_KB/chatbot-drafts.md#4a-system-prompt-v11-approved) |
| Ingest manifest                         | The list of source documents to ingest (which module sections, exercises, daily-practice prompts). Therapist confirms each is final and approved for retrieval.                                                           | ⚠️ TBD — list assembled in Phase 4                                                                                            |
| Program-overview content (`program-overview.json`) | Dutch overview ingested with category `overview` so the chatbot can answer "wat is dit programma?", "wat is ACT?", "voor wie?", "wat doet de gids?". Six sections (program-purpose, for-whom, act-in-plain-dutch, six-principles, chatbot-role, crisis-orientation). | ✅ APPROVED v1.1 2026-06-13 — see [chatbot-drafts.md § 4b](./THERAPEUT_KB/chatbot-drafts.md#4b-program-overview-content-v11-approved) |
| Crisis-signal keyword list              | Dutch terms / phrases that bypass retrieval entirely and route the user to `/noodhulp` (e.g. self-harm, suicidal ideation, severe relapse). Owned by `therapeut` agent; reviewed each time modules or intake change.       | ✅ APPROVED 2026-06-12 — see [chatbot-drafts.md § 2](./THERAPEUT_KB/chatbot-drafts.md#2-crisis-signal-keyword-list-dutch)     |
| `src/content/nl/chat.json` (UI strings) | Dutch UI copy: placeholder text, suggested questions, disclaimer, empty-state, error messages. Drafted by `therapeut` agent then code-reviewed for tone.                                                                  | ✅ APPROVED 2026-06-12 — see [chatbot-drafts.md § 3](./THERAPEUT_KB/chatbot-drafts.md#3-chat-ui-strings--draft-srccontentnlchatjson) |

## Therapist review still needed

1. **Clinical sign-off** on intake safety questions (`intake.json` — `draftNotice` remains)
2. **Voice review** — does the Dutch copy match your therapeutic voice?
3. **Audio recording** — transcripts ready; `audioUrl` still `null` on all exercises
4. **Legal review** before public launch (copyright note in concept doc)
5. **Chatbot sign-off** (when ADR-005 reaches Phase 3): system prompt, ingest manifest, crisis keyword list, chat UI strings

## How to submit revisions

1. Edit Dutch text in `src/content/nl/modules/<id>.json` or use `/therapeut`
2. Mark changes in this file
3. Run `npm run validate:content` before PR
