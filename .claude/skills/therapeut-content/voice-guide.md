# Voice Guide — Nederlandse therapeutische stem

> For the `therapeut` agent. All output in this voice goes to `src/content/nl/`.

## Tone

- **Warm en direct** — alsof je naast iemand zit, niet boven iemand staat
- **Uitnodigend** — "je kunt proberen", "misschien herken je", "het kan helpen om"
- **Geen belerende toon** — vermijd "je moet", "je zou moeten", "het is belangrijk dat je"
- **Geen diagnose** — geen labels ("je bent depressief"), wel ervaringen ("soms voelt het zwaar")
- **Geen cure-belofte** — geen "dit lost je pijn op"; wel "dit kan je helpen anders om te gaan met wat er is"

## Persoon en aanspreekvorm

- **Je/jij** (informeel maar respectvol) — passend bij een zelfgeleide app
- **Geen "u"** tenzij expliciet gevraagd voor een formeel scherm
- Actieve zinnen; korte alinea's (max ~120 woorden per alinea)

## ACT-consistent taalgebruik

| Gebruik                   | Vermijd                        |
| ------------------------- | ------------------------------ |
| Ruimte maken              | Onderdrukken, wegwerken        |
| Waarden, richting, kompas | Doelen halen, genezen worden   |
| Observeren, opmerken      | Analyseren, oplossen           |
| Ongemak toelaten          | Positief denken, vechten tegen |
| Kleine stap, experiment   | Grote belofte, snelle fix      |
| Terugval is informatie    | Mislukking, fout, falen        |

## Lichaamswerk-taal

- Het lichaam **signaleert**, **draagt**, **herinnert** — geen vijand
- "Waar voel je dit?" / "Wat merk je in je lichaam?"
- Adem, grond, spanning, loslaten — concreet, niet zweverig
- Geen medische claims over fysieke genezing

## Per doelgroep (in examples, niet in hoofdtekst)

| Type          | Herkenbare invalshoek                                             |
| ------------- | ----------------------------------------------------------------- |
| `pain`        | Vermijden van beweging, medicatie, hoop op genezing, vermoeidheid |
| `mental`      | Piekeren, controle, terugtrekken, innerlijke criticus             |
| `alcohol`     | Drang, schaamte, korte verlichting, sociale context               |
| `combination` | Overlap: vermijding werkt op meerdere vlakken tegelijk            |

## Veiligheidstaal

- Vragen zijn een **aanbod van zorg**, geen poort om te "slagen"
- Bij doorverwijzing: warm, niet afwijzend — "Er is nu extra ondersteuning nodig"
- Crisislijn: **0800-0113** (altijd correct)
- Nooit suggereren dat de app voldoende is bij acute suïcidaliteit of ernstige verslaving zonder begeleiding

## Transcript-stijl (geleide oefeningen)

```
Begin: uitnodiging om te landen, geen haast
Midden: geleide stappen met pauzes
Einde: zacht terugkomen, geen abrupt stoppen
Markers: [pauze 3 sec], [pauze 5 sec]
```

## Interpunctie

- **Geen streepjes als leesteken** in user-facing copy: geen em dash (`—`), en dash (`–`), of koppelteken als pauze (`-`)
- Gebruik in plaats daarvan: punt, komma, dubbele punt, of herformuleer de zin
- Voorbeeld fout: `Acceptatie is niet opgeven — het is stoppen met vechten`
- Voorbeeld goed: `Acceptatie is niet opgeven. Het is stoppen met vechten.` of `Acceptatie is niet opgeven: stoppen met vechten.`
- Opsommingen: gebruik `•` of genummerde lijsten (`1.`), nooit `-` als bullet
- Samengestelde woorden met koppelteken (`korte-termijn`, `zelf-als-context`) zijn toegestaan als één woord

## Verboden

- Engelse woorden in user-facing copy
- Em dash, en dash, of `-` als zinscheiding in `src/content/nl/`
- CBT-only framing (gedachten veranderen) waar ACT (afstand nemen) bedoeld is
- Spiritueel of esoterisch taalgebruik zonder grounding in lichaam
- Humor over klachten of schaamte bij verslaving
- Tekst uit Resiliens, Hayes, of andere bronnen overnemen
