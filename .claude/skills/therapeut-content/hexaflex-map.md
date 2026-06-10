# Hexaflex Map — Modules ↔ ACT ↔ Lichaamswerk

> Reference for the `therapeut` agent. English for planning; output is always Dutch.

## Psychological flexibility (hexaflex)

The six ACT processes from [Resiliens ACT Coach](https://www.resiliens.com/nl/act-coach)
map to modules 2–7. Modules 0–1 are **pre-hexaflex foundation** — unique to this app.

| Hexaflex process | Resiliens label (NL) | Module | JSON file | Body work |
|------------------|----------------------|--------|-----------|-----------|
| — | (foundation) | 0 Onboarding | `0-onboarding.json` | Lichaamsbewustzijn intake |
| — | (foundation) | 1 Herkennen | `1-recognition.json` | Bodyscan |
| Acceptance | Acceptatie | 2 Acceptatie | `2-acceptance.json` | Ademruimte |
| Defusion | Defusie | 3 Defusie | `3-defusion.json` | Spanning & loslaten |
| Present moment | Huidig moment | 4 Aanwezig zijn | `4-presence.json` | Zintuigenoefening |
| Self-as-context | Zelf-als-context | 5 Zelf-als-context | `5-self-as-context.json` | Centreren |
| Values | Waarden | 6 Waarden | `6-values.json` | Hartgebied-oefening |
| Committed action | Toegewijde actie | 7 Toegewijd handelen | `7-committed-action.json` | Bewegingsoefening |

## Per-module writing brief

### Module 0 — Onboarding
- **Goal:** User feels understood; knows what to expect
- **Write:** Warm intro, ACT in plain Dutch, intake context, safety check intro
- **Body:** Short first body awareness — "where are you now?"
- **Avoid:** Overwhelming theory; clinical jargon

### Module 1 — Herkennen
- **Goal:** Recognize avoidance pattern
- **Write:** Avoidance cycle, short-term relief / long-term reinforcement, brain as survival system
- **Body:** Bodyscan — where do you live in your body?
- **Link to hexaflex:** Sets up why acceptance/defusion matter later

### Module 2 — Acceptatie
- **Goal:** Experience acceptance ≠ resignation
- **Write:** Stop the war; paradox of control; making space as skill
- **Body:** Breath space — breathe toward discomfort
- **Back-ref:** Module 1 avoidance cycle

### Module 3 — Defusie
- **Goal:** Thoughts are thoughts, not facts
- **Write:** Fusion vs observation; inner critic as loudspeaker; therapist's own defusion techniques
- **Body:** What does the body hold when you believe a thought?
- **Back-ref:** Module 2 acceptance of thoughts

### Module 4 — Aanwezig zijn
- **Goal:** Anchor in the now
- **Write:** Mindfulness as skill (not philosophy); present as only place for change; daily anchors
- **Body:** Sensory exercise — body as anchor
- **Back-ref:** Module 3 past/future thoughts

### Module 5 — Zelf-als-context
- **Goal:** You are more than the complaint
- **Write:** Not your pain/anxiety/urge; content vs container; observing core
- **Body:** Centering — who is watching?
- **Back-ref:** Module 4 presence as observer

### Module 6 — Waarden
- **Goal:** Direction despite pain
- **Write:** Values as directions not goals; life worth living with pain; compass in hard choices
- **Body:** Heart-area — what truly moves you?
- **Back-ref:** Module 5 observing self toward values

### Module 7 — Toegewijde handelen
- **Goal:** Small committed steps
- **Write:** Small steps count; relapse as information; flexible persistence
- **Body:** Movement in a new direction
- **Back-ref:** Module 6 + all earlier modules

## Resiliens ACT Coach feature parity (reference)

Features on [ACT Coach](https://www.resiliens.com/nl/act-coach) — ensure app covers equivalent ground:

| ACT Coach feature | Covered in this app |
|-------------------|---------------------|
| Waardenverduidelijking | Module 6 + weekly check-in (daily practice) |
| Mindfulness-oefening | Module 4 + emergency grounding |
| Defusietechnieken | Module 3 |
| Toegewijde actie | Module 7 |
| Acceptatieoefeningen | Module 2 |
| Voortgangsregistratie | Module progress + mood tracker |

**Differentiators to preserve in every module:**
- Integrated body work (not separate "mindfulness tab")
- Three complaint types with conditional examples
- Psychosomatic framing
- Non-punitive relapse language

## Back-reference labels (must match module titles)

| moduleId | Dutch label in JSON |
|----------|---------------------|
| `onboarding` | Welkom & Intake |
| `recognition` | Herkennen / De vermijdingscirkel |
| `acceptance` | Acceptatie |
| `defusion` | Defusie |
| `presence` | Aanwezig zijn |
| `self-as-context` | Zelf-als-context |
| `values` | Waarden |
| `committed-action` | Toegewijd handelen |
