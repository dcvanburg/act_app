# Complaint-Type Examples — Writing Guide

> Use when filling `examples` fields in module JSON. Dutch output only.

## Keys

| Key           | Audience                                 | Core patterns                                                                                                       |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pain`        | Chronische pijn (fysiek/psychosomatisch) | Vermijden van beweging, rust als enige strategie, medicatie als controle, hoop op genezing, frustratie bij onbegrip |
| `mental`      | Angst, burn-out, depressie, stress       | Piekeren, terugtrekken, controle, innerlijke criticus, uitstel, overprikkeling                                      |
| `alcohol`     | Alcohol/verslavingsklachten              | Drang, schaamte, korte verlichting, sociale druk, "morgen stop ik", verbergen                                       |
| `combination` | Meerdere klachten tegelijk               | Vermijding werkt op meerdere vlakken; vermoeidheid versterkt alles; schaamte over "alles tegelijk"                  |

## Writing rules for examples

1. **One short paragraph each** (~60–100 words)
2. **Concrete situation** — herkenbaar dagelijks moment, geen casusverhaal
3. **No identifying details** — geen namen, leeftijden, diagnoses
4. **Same section topic** — example illustrates the section's ACT point, not a new topic
5. **Non-judgmental** — beschrijf gedrag, niet "fout" gedrag

## Example angles per module (starting points)

### Module 1 — Vermijdingscirkel

| Key         | Angle                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------ |
| pain        | Sofa blijven omdat bewegen pijn geeft; korte opluchting, maar conditie en stemming verslechteren |
| mental      | Afspraak afzeggen vanwege angst; directe opluchting, maar eenzaamheid groeit                     |
| alcohol     | Eerste glas na een zware dag; spanning daalt, maar schaamte de volgende ochtend                  |
| combination | Dag beginnen met pijnstillers én alcohol om de dag door te komen. Alles voelt te veel            |

### Module 2 — Acceptatie

| Key         | Angle                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------ |
| pain        | Niet vechten tegen de pijn opstaan, maar merken: "hij is er, en ik kan toch koffie zetten" |
| mental      | Angst in het lichaam voelen zonder het gevoel weg te duwen                                 |
| alcohol     | Drang opmerken als golf die komt en gaat, zonder meteen te handelen                        |
| combination | Meerdere ongemakken tegelijk toelaten zonder alles op te lossen                            |

### Module 3 — Defusie

| Key         | Angle                                                                         |
| ----------- | ----------------------------------------------------------------------------- |
| pain        | Gedachte "dit wordt nooit beter" opmerken als gedachte, niet als voorspelling |
| mental      | "Ik kan dit niet aan" horen als woorden in je hoofd, niet als waarheid        |
| alcohol     | "Één keer kan geen kwaad" herkennen als oude zin, niet als plan               |
| combination | "Ik ben kapot": meerdere klachten samengevat in één harde gedachte            |

### Module 4 — Aanwezig zijn

| Key         | Angle                                                              |
| ----------- | ------------------------------------------------------------------ |
| pain        | Voeten op de vloer voelen terwijl pijn op de achtergrond blijft    |
| mental      | Eén ademhaling volledig volgen terwijl zorgen wachten              |
| alcohol     | De drang nu voelen in het lichaam zonder naar de koelkast te lopen |
| combination | Anker in het nu vinden terwijl alles tegelijk aandacht vraagt      |

### Module 5 — Zelf-als-context

| Key         | Angle                                              |
| ----------- | -------------------------------------------------- |
| pain        | "Ik ben mijn pijn" vs "ik merk pijn op"            |
| mental      | "Ik ben mijn angst" vs "ik zie angst voorbijkomen" |
| alcohol     | "Ik ben een verslaafde" vs "ik merk drang op"      |
| combination | Identiteit losmaken van de som van alle klachten   |

### Module 6 — Waarden

| Key         | Angle                                                      |
| ----------- | ---------------------------------------------------------- |
| pain        | Verbinding met familie belangrijker dan pijnvrij zijn      |
| mental      | Eerlijkheid in relaties, ook als angst zegt "zwijg"        |
| alcohol     | Gezondheid en betrouwbaarheid als richting, niet perfectie |
| combination | Klein stukje leven dat telt, ondanks alles wat meespeelt   |

### Module 7 — Toegewijde actie

| Key         | Angle                                                          |
| ----------- | -------------------------------------------------------------- |
| pain        | Vijf minuten wandelen ondanks pijn, als waarde "bewegen"       |
| mental      | Eén bericht sturen aan een vriend ondanks angst                |
| alcohol     | Eén avond thuis blijven als stap richting gezondheid           |
| combination | Kleine stap die één waarde raakt, niet alles tegelijk oplossen |

## JSON format

```json
"examples": {
  "pain": "…",
  "mental": "…",
  "alcohol": "…",
  "combination": "…"
}
```

If a section has no `examples` field in the schema, do not add one without checking
`src/types/content.ts` and the module JSON structure first.
