# Navigation Specification

## Model: Guided Path with Free Navigation

Linear progression respects ACT's non-linear nature in recovery.

## Rules

| Rule | Behavior |
|------|----------|
| Forward unlock | Module N unlocks when module N-1 is `completed` |
| Back navigation | Any `completed` module is revisitable |
| Revisit rendering | Completed modules render as a **single scrollable page** — no pagination, no step tracking |
| In-progress resume | `lastStepId` restores position within module (paginated active flow only) |
| Daily practice | Unlocks when module 7 status is `completed` |
| Emergency button | Visible on every screen after first app load |

## Suggested routes (English paths, Dutch UI)

| Path | Screen | Access |
|------|--------|--------|
| `/` | Home / program overview | Always |
| `/onboarding` | Module 0 | Always |
| `/modules/[id]` | Module content | Per unlock rules |
| `/oefeningen` | Standalone exercises | After program complete |
| `/dagboek` | Journal | After program complete |
| `/check-in` | Weekly check-in | After program complete |
| `/noodhulp` | Emergency / crisis | Always |

## In-module pagination

Each module renders as a sequence of **paginated screens** (not a single scroll). This enables:
- Accurate `lastStepId` tracking per screen
- Clean progress indication (step X of N)
- Mobile-friendly focused reading

### Screen structure

Each module JSON will include a `screens` array. Example:

```json
{
  "screens": [
    { "id": "intro",           "type": "section",  "sectionId": "intro" },
    { "id": "avoidance-cycle", "type": "section",  "sectionId": "avoidance-cycle" },
    { "id": "body-exercise",   "type": "exercise"  },
    { "id": "practical-task",  "type": "task"      }
  ]
}
```

The **last screen in the array** triggers the `completed` status transition on mount.
`lastStepId` stores the most recently visited screen `id`.

## Back-references (in-module)

Rendered as contextual cards linking to prior modules:

| Current module | Links to |
|----------------|----------|
| 2 Acceptatie | 1 Herkennen (vermijdingscirkel) |
| 3 Defusie | 2 Acceptatie |
| 4 Aanwezig zijn | 3 Defusie |
| 5 Zelf-als-context | 4 Aanwezig zijn |
| 6 Waarden | 5 Zelf-als-context |
| 7 Toegewijd handelen | 6 Waarden + all prior |

## Emergency button UX

- **Position:** Fixed; does not scroll away (e.g. `position: fixed`, bottom-right)
- **Label:** `Noodknop` or icon + `Noodhulp`
- **Action:** Opens grounding exercise immediately (not a menu)
- **Secondary:** Link to crisis line 0800-0113 on same screen

## Intake personalization (TBD)

Concept doc notes: determine how intake personalizes the journey. Suggested v1 approach:

- Store `complaintTypes` on profile
- Show relevant examples in module copy (conditional paragraphs)
- Do **not** skip modules based on intake — same path for all

Document final personalization rules in [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) once decided.
