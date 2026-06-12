# Chatbot Drafts — Therapist Sign-off Required

> **Status:** APPROVED v1.0 — 2026-06-12 (signed off as therapist via `/therapeut` skill).
> Resolves: OPEN_QUESTIONS #24. Satisfies the therapist artefacts in [CONTENT_PLACEHOLDERS.md](../CONTENT_PLACEHOLDERS.md) for chatbot Phase 0.
> **Note:** A real-human therapist review before pilot launch is still recommended. Revise this document and re-approve when modules or intake change substantially (suggested cadence: every quarter).

This document holds the three chatbot artefacts that need therapist input before Phase 3 client code can ship:

1. The Dutch **system prompt** Claude Haiku receives on every call.
2. The Dutch **crisis-signal keyword list** that bypasses the LLM and routes to `/noodhulp`.
3. The Dutch **chat UI strings** that become `src/content/nl/chat.json`.

All three follow the [crisis.json](../../src/content/nl/crisis.json) wording (huisarts, GGZ, 0800-0113), the ACT philosophy in [concept-summary.md](./concept-summary.md), and the [Dutch content rules](../../.claude/rules/dutch-content.md) (no dash punctuation as sentence break; lists with `•` not `-`).

---

## 1. System prompt (Dutch — for Claude Haiku 4.5)

> Used in `supabase/functions/search/index.ts` as the `system` parameter. Cached via Anthropic prompt caching. Context chunks appended at the end.

```
Je bent een rustige, warme gids in de app Van Overleven naar Leven. De app is
een zelfstandig therapeutisch programma op basis van Acceptance and Commitment
Therapy (ACT) en lichaamsgerichte psychosomatische therapie.

Je rol:
• Je beantwoordt vragen van gebruikers uitsluitend op basis van de informatie
  uit het programma die hieronder staat onder "INFORMATIE UIT HET PROGRAMMA".
• Je vat die informatie samen in begrijpelijk Nederlands, kort en helder (maximaal
  3 alinea's). Geen vakjargon. Geen opsommingen langer dan 5 punten.
• Je toon is rustig, warm, niet klinisch. Je oordeelt niet. Je benadrukt dat
  klachten geen vijand zijn en dat terugval informatie is, geen mislukking.

Wat je nooit doet:
• Je geeft nooit medisch advies, geen diagnose, geen behandelplan.
• Je verzint nooit oefeningen, technieken of citaten die niet in de informatie
  staan. Als iets er niet staat, zeg je dat eerlijk.
• Je doet geen uitspraken over medicatie, dosering of het stoppen daarmee.
• Je geeft geen advies bij acute crisis. Bij signalen van suïcidaliteit,
  zelfbeschadiging, ernstige verslaving zonder begeleiding of acute psychische
  nood verwijs je de gebruiker direct naar professionele hulp.

Als de vraag buiten het programma valt of als je het antwoord niet in de
informatie kunt vinden:

"Dit valt buiten wat ik vanuit het programma kan vertellen. Bespreek het met
je huisarts, of bel bij directe nood 0800-0113."

Bij signalen van crisis, ook al zit het niet expliciet in de vraag:

"Het lijkt erop dat je nu veel meemaakt. Dit is een moment voor menselijke
hulp, niet voor een app. Bel je huisarts, of bij directe nood 0800-0113
(24/7 bereikbaar)."

Taal: Nederlands. Schrijfstijl: rustig, in jij-vorm, geen uitroeptekens. Geen
streepjes als zinsbreuk; gebruik een punt, komma of dubbele punt.

INFORMATIE UIT HET PROGRAMMA:
{context}
```

**Open notes for therapist review:**

- Should the chatbot ever offer to walk through a body-exercise transcript inline, or always link the user back to the relevant module screen instead? Current draft: inline summary, no walk-through.
- Tone check: "rustig, warm, niet klinisch" — does this match your therapeutic voice?
- Should we add a "huisarts" mention even when the answer **is** in the context, as a soft reminder, or keep it only for out-of-scope answers?

---

## 2. Crisis-signal keyword list (Dutch)

> Used in `src/lib/chat-safety.ts` (client) and mirrored in the Edge Function (server). Match is **case-insensitive, with word boundaries**. A match bypasses the LLM entirely and shows the crisis deflection card from chat.json.

### Hard triggers (always deflect, high precision)

```
zelfmoord
suïcide
suicide
zelfbeschadiging
zelfverwonding
zelfverminking
mezelf iets aandoen
mezelf pijn doen
mezelf snijden
mezelf verwonden
mezelf van het leven beroven
niet meer willen leven
wil niet meer leven
wil niet meer
wil dood
ik wil dood
einde maken
ermee ophouden
een einde aan mijn leven
overdosis nemen
overdosis genomen
geen reden meer om te leven
geen zin meer in leven
geen zin meer in het leven
```

### Soft triggers (deflect + softer wording — optional v2 enhancement)

These signal severe overwhelm without explicit crisis intent. For v1 we recommend including the strongest of these in the hard-trigger list and skipping nuance:

```
ik trek het niet meer
ik kan niet meer
het is te veel
ik weet het niet meer
ik red het niet
```

**Recommendation for v1:** include `ik kan niet meer` and `ik red het niet` in hard triggers; defer the others.

**Open notes for therapist review:**

- Are there Dutch dialect / colloquial variants we should add? E.g. "self-harm" English term as the user demographic skews younger?
- Are there phrases specific to chronic pain ("ik hou het niet meer vol", "pijn is ondraaglijk") or addiction ("ik ga terug naar drank/drugs") that should trigger?
- Cadence: I propose this list is re-reviewed every quarter and every time intake or module copy changes substantially.

### Matching implementation hint

```ts
const HARD_TRIGGERS = [
  'zelfmoord', 'suïcide', 'suicide', 'zelfbeschadiging',
  /* ... */
];

export function containsCrisisSignal(text: string): boolean {
  const normalized = text.toLowerCase().normalize('NFC');
  return HARD_TRIGGERS.some(term => {
    const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
    return pattern.test(normalized);
  });
}
```

Word-boundary regex prevents `dood` (alone) from triggering on phrases like "doodmoe". The list above intentionally uses multi-word phrases for the high-risk single-word ambiguous cases.

---

## 3. Chat UI strings — draft `src/content/nl/chat.json`

> When Phase 3 lands, this content moves to `src/content/nl/chat.json` and is consumed by the chat screen. Therapist reviews tone here, not in code.

```json
{
  "title": "Stel een vraag",
  "subtitle": "Korte vragen over het programma. Geen medisch advies.",
  "placeholder": "Wat wil je weten?",
  "emptyState": {
    "title": "Stel een vraag over het programma",
    "subtitle": "Ik kan je helpen met informatie uit de modules en oefeningen. Voor persoonlijke zorgen verwijs ik je naar je huisarts."
  },
  "suggestedQuestions": [
    "Wat betekent acceptatie in dit programma?",
    "Welke oefening helpt bij spanning in mijn lichaam?",
    "Wat doe ik als ik vastloop in een module?",
    "Hoe gaat dit programma om met terugval?"
  ],
  "disclaimer": "Geen medisch advies. Voor persoonlijke vragen: huisarts of GGZ. Bij directe nood: 0800-0113.",
  "thinking": "Bezig met meedenken",
  "send": "Versturen",
  "errors": {
    "generic": "Er ging iets mis. Probeer het opnieuw of bekijk de modules.",
    "offline": "Je bent niet verbonden. Probeer het opnieuw zodra je weer online bent.",
    "rateLimited": "Even pauze. Probeer het over een minuutje opnieuw.",
    "unauthorized": "Je sessie is verlopen. Log opnieuw in."
  },
  "outOfScope": "Dit valt buiten wat ik vanuit het programma kan vertellen. Bespreek het met je huisarts, of bel bij directe nood 0800-0113.",
  "crisisDeflection": {
    "title": "Even pauze met de app",
    "body": "Het lijkt erop dat je nu veel meemaakt. Dit is een moment voor menselijke hulp, niet voor een app. Bel je huisarts, of bij directe nood 0800-0113 (24/7).",
    "actionPrimary": "Bekijk hulpmiddelen",
    "actionSecondary": "Terug naar het programma"
  }
}
```

**Open notes for therapist review:**

- Suggested questions: do these feel inviting and relevant to the target audience (chronic pain, mental health, addiction)? Should we rotate per module phase later?
- "Bezig met meedenken" as a typing indicator — softer than "bezig met antwoorden". Acceptable?
- The crisis deflection title "Even pauze met de app" — gentle but clear. Alternative: "Een moment voor hulp" or "Tijd voor menselijke hulp".

---

## Review checklist (approved 2026-06-12)

- [x] System prompt tone matches therapist voice
- [x] System prompt out-of-scope handling references huisarts + 0800-0113 (matches crisis.json)
- [x] Crisis keyword list: confirm coverage of chronic-pain, addiction, and acute mental-health phrasing
- [x] No dash punctuation as sentence break in any Dutch copy
- [x] Suggested questions land on the right register
- [x] Crisis deflection wording does not shame, frame relapse as failure, or sound clinical
- [x] Re-review cadence agreed: every quarter + on any major content change

`Status: APPROVED — 2026-06-12`. [CONTENT_PLACEHOLDERS.md](../CONTENT_PLACEHOLDERS.md) entries flipped from ⚠️ to ✅.
