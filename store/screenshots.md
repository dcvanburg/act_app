# Store screenshots — specifications

Three iOS screenshots required per device size. Same composition, scaled. The mockup HTML lives in `assets/src/` (delivered separately; reference: `act_app_screenshots.html` from 2026-06-09 design pass).

## Required sizes

| Device                                   | Resolution                | Count                                                    |
| ---------------------------------------- | ------------------------- | -------------------------------------------------------- |
| iPhone 6.7" (iPhone 14/15 Pro Max)       | 1290 × 2796 px (portrait) | 3 — primary, mandatory                                   |
| iPhone 6.5" (iPhone XS Max / 11 Pro Max) | 1242 × 2688 px (portrait) | 3 — required for iOS-only, can scale from 6.7"           |
| iPad 12.9" (iPad Pro M2)                 | 2048 × 2732 px (portrait) | Optional, defer to post-v1 unless `supportsTablet: true` |

Android Play Console accepts the same compositions at 16:9 or 9:16 with phone screenshots; 1080 × 1920 px is fine.

## Caption / text-overlay style

- Background: `#F5F0E8` (warm sand) full bleed under the phone bezel mockup
- Caption font: Georgia, 64-80pt, `#2C2C2A`
- Sub-caption (optional): Arial, 36pt, `#888780`
- Phone bezel: thin off-white frame, no notch flourish, no "iPhone 15 Pro" badge
- Status bar inside the mockup: 9:41, no carrier text

## Screenshot 1 — "Jouw pad, jouw tempo"

**Screen rendered:** Module overview (`app/(app)/home/index.tsx`)
**Caption:** `Jouw pad, jouw tempo`
**Sub-caption:** `8 modules. Lineair opgebouwd. Op jouw tempo.`

Must include:

- Progress bar (28% — modules 0, 1 done, 2 in progress)
- Module list with mixed states: 2× completed (✓), 1× current (highlighted), 2× locked (🔒)
- Noodknop card visible at bottom — pill style, warm red `#D85A30`
- Header reads "Jouw pad" / "Modules"
- Dutch labels only

Must NOT include:

- Any real user data
- Any [PLACEHOLDER] text
- Status bar carrier name
- Debug indicators

## Screenshot 2 — "Dagelijks bijhouden"

**Screen rendered:** Mood + journal entry (Phase γ-1 / γ-6 — see plan)
**Caption:** `Dagelijks bijhouden`
**Sub-caption:** `Stemming, dagboek en streak — alles op één plek.`

Must include:

- Mood selector (5 faces), neutral face selected
- Journal preview text (sample Dutch only — no real user content; example: "Vandaag merkte ik dat ik meer ruimte kon maken voor de spanning in mijn borst…")
- Streak card: 🔥 with "7 dagen"
- ACT tags: "Acceptatie", "Lichaamsscan", "Module 2"
- Header reads "Vandaag" / "Hoe voel je je?"

> ⚠ Mood + journal + streak are γ-tier features. This screenshot requires those features to ship before submission.

## Screenshot 3 — "Zie je groei"

**Screen rendered:** Progress dashboard (Phase γ-5)
**Caption:** `Zie je groei`
**Sub-caption:** `Volg je voortgang per ACT-proces.`

Must include:

- 4 stat cards in 2×2 grid: Modules `2/8`, Oefeningen `14`, Dagboek `9`, Langste streak `12`
- 2 cards in green tint (active engagement), 2 in neutral grey
- ACT processen row: 4 tag chips — 2 filled green (Acceptatie, Defusie), 2 muted (Waarden, Handelen)
- Header reads "Jouw groei" / "Voortgang"

> ⚠ Analytics dashboard is γ-5. Screenshot requires that feature to ship before submission.

## Dependency tree (which γ features must land before screenshots can be produced)

| Screenshot             | Blocks on                                                   |
| ---------------------- | ----------------------------------------------------------- |
| 1 — module overview    | α4 (program flow) — present after α6 finishes               |
| 2 — mood + journal     | γ-1 (mood tracker), γ-6 (enhanced journal), γ-3 (streaks)   |
| 3 — progress dashboard | γ-5 (analytics) — depends on γ-1, γ-2, γ-6, γ-9 having data |

Realistic store-submission readiness: after γ-5 lands. Until then, screenshots can be mocked from the design references but not captured from the running app.

## Capture process (once features ship)

1. Run the app in iOS simulator at iPhone 14 Pro Max
2. Seed dev data via `npm run seed:store-screenshots` (TBD — script lands in γ-5 PR)
3. Use Xcode → Window → Devices → Take Screenshot, or Cmd+S in the simulator
4. Compose with caption in Figma using the 1290×2796 template (TBD: `assets/src/store-template.fig`)
5. Export as PNG, sRGB, no transparency, no rounded corners
