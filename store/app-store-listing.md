# App Store / Play Store listing copy

**Status:** Draft v1 — final review by therapist + legal before submission.

App name (in-app display name in `src/content/nl/common.json` `app.name`) is still pending — the store listing below uses "ACT" with subtitle "Van overleven naar leven". If the in-app brand stays "Van Overleven naar Leven", reconcile before submission.

---

## App name (30 chars max)

```
ACT — Acceptance & Commitment
```

> ⚠ Apple reviewer guidance: single-word generic app names (e.g. "ACT") are often rejected as not distinctive. The full string "ACT — Acceptance & Commitment" should pass. Have a backup ready, e.g. "ACT • Van overleven naar leven".

## Subtitle (30 chars max)

```
Van overleven naar leven
```

## Promotional text (170 chars max — editable post-launch without re-review)

```
Een zelfgeleid ACT-programma bij chronische pijn, stress, burn-out, angst en verslavingsklachten. Lichaam, geest en waarden — op jouw tempo.
```

## Description (4000 chars max — Dutch)

```
ACT is een zelfgeleid therapeutisch programma gebaseerd op Acceptance and Commitment Therapy — een van de meest evidence-based psychologische methoden ter wereld.

Of je nu worstelt met chronische pijn, stress, burn-out, angst of verslavingsklachten: ACT helpt je niet om klachten weg te maken, maar om te leren leven met wat er is — en toch in beweging te komen richting wat écht belangrijk voor je is.

Wat je leert:
— Klachten toelaten zonder erin te verdwijnen
— Afstand nemen van negatieve gedachten
— Contact maken met het huidige moment
— Handelen vanuit je eigen waarden

Wat de app biedt:
— 8 modules opgebouwd rond de 6 ACT-processen
— Lichaamsgerichte oefeningen bij elke module
— Dagboek om je proces bij te houden
— Stemmingstracker en wekelijkse check-in
— Streak-systeem om consistentie te belonen
— Noodknop voor directe grondingsoefening

Een internetverbinding is nodig om de app te gebruiken.

ACT is geen vervanging voor professionele hulp bij ernstige klachten. Bij crisis: bel 0800-0113 of ga naar je huisarts.
```

> ⚠ One claim in this description still needs reconciling before submission:
>
> - **"Lichaamsgerichte oefeningen"** language is fine for text-only body exercises (v1 decision #13), but reviewers may expect audio. Add a clarifying note in the description or screenshots that v1 exercises are text-guided.

## Keywords (100 chars max, comma-separated)

```
ACT,therapie,mindfulness,angst,pijn,burn-out,verslaving,waarden,herstel,mentaal,welzijn
```

## What's new (release notes, v1.0)

```
Eerste release — welkom bij ACT.
```

## Support URL

`https://dcdataconsultancy.nl/act-app/support` — **TBD, page does not yet exist**

## Marketing URL (optional)

`https://dcdataconsultancy.nl/act-app` — **TBD**

## Privacy policy URL (required)

**TBD — see OPEN_QUESTIONS #12.** Apple App Store Connect requires this URL before a build can be submitted for review. Cannot ship without.

## App category

Primary: `Health & Fitness`
Secondary: `Medical` (use with caution — "Medical" category triggers extra review for any clinical-sounding claim)

## Age rating

Recommended: **17+** (because the app discusses self-harm, suicide, addiction, and crisis support, even though it is referral-based, not depictive).

Apple questionnaire answers:

- Mature/Suggestive Themes: Frequent/Intense
- Medical/Treatment Information: Infrequent/Mild
- Alcohol, Tobacco, or Drug Use or References: Infrequent/Mild
- All other categories: None

## Content warnings (Android Play Console)

- "References to self-harm, suicide, and addiction in a supportive, referral-focused context"
- "Not a replacement for professional mental health care"

## App Privacy declarations (Apple)

Data collected (Article 9 — health/mental health):

- Email address — linked to identity, used for account & magic-link auth
- Mental health journal entries — linked to identity, NOT used for tracking
- Mood logs — linked to identity, NOT used for tracking
- Exercise/program progress — linked to identity, NOT used for tracking

Data not collected: third-party analytics, advertising, crash logs containing user content.

## Google Play Data Safety form

- Data collected: see above
- Encrypted in transit: yes (TLS via Supabase)
- Encrypted at rest: yes (Supabase EU region)
- Can users request deletion: yes (in-app account deletion + email fallback)
- Independent security review: TBD

## Pre-submission checklist

- [ ] Privacy policy URL live (OPEN_QUESTIONS #12)
- [ ] Support URL live
- [ ] Apple Developer + Google Play Console accounts (OPEN_QUESTIONS #16)
- [ ] All [PLACEHOLDER] content filled (see `docs/CONTENT_PLACEHOLDERS.md` + `npm run validate:content`)
- [ ] App name "ACT — Acceptance & Commitment" cleared with App Store reviewer guidance
- [x] Description does NOT promise offline (removed; v1 requires connection per OPEN_QUESTIONS #8)
- [ ] Crisis disclaimer present in description and visible in screenshots
- [ ] Three iOS screenshots prepared (see `store/screenshots.md`)
- [ ] Android adaptive icon foreground + background colour set
- [ ] Notification icon white-on-transparent (Android tints automatically)
- [ ] Bundle ID `nl.actapp.app` reserved in App Store Connect and Play Console
