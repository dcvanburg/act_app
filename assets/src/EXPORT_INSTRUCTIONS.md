# Asset export instructions

SVG masters in this folder are the single source of truth for the app's visual identity. Export to PNG at the required sizes before submitting to App Store Connect / Play Console or before EAS Build picks them up.

## Files

| Master (SVG)            | Target PNG                     | Size                                   | Used by                               |
| ----------------------- | ------------------------------ | -------------------------------------- | ------------------------------------- |
| `icon.svg`              | `assets/icon.png`              | 1024×1024                              | iOS App Store icon, Expo `icon` field |
| `adaptive-icon.svg`     | `assets/adaptive-icon.png`     | 1024×1024 (transparent bg)             | Android adaptive icon foreground      |
| `splash.svg`            | `assets/splash.png`            | 1284×2778 (iPhone 14 Pro Max baseline) | Expo splash screen                    |
| `notification-icon.svg` | `assets/notification-icon.png` | 96×96                                  | Android notification tray icon        |

## How to export

Pick one — all three produce identical output.

### Option A — Figma / Sketch

1. Open the SVG file
2. Frame at the target size in the table above
3. Export as PNG, RGB, transparent where required, 72 DPI

### Option B — Inkscape (CLI)

```bash
inkscape icon.svg --export-type=png --export-filename=../icon.png -w 1024 -h 1024
inkscape adaptive-icon.svg --export-type=png --export-filename=../adaptive-icon.png -w 1024 -h 1024
inkscape splash.svg --export-type=png --export-filename=../splash.png -w 1284 -h 2778
inkscape notification-icon.svg --export-type=png --export-filename=../notification-icon.png -w 96 -h 96
```

### Option C — sharp (Node, scriptable)

```bash
npm install -D sharp
node -e "require('sharp')('icon.svg').resize(1024, 1024).png().toFile('../icon.png')"
```

Once the Expo project is scaffolded (PR α1), an `npm run generate:assets` script will codify Option C.

## Notes

- Do NOT commit the exported PNGs to git unless EAS Build needs them ahead of `α1`. Keep PNGs out of source for now — regenerate from SVG on demand.
- The Expo `image` field for splash accepts PNG only. JPG is not supported.
- For Android adaptive icons, the foreground must be transparent — `adaptive-icon.svg` already has no background rect. The colour behind it is set via `app.json` → `android.adaptiveIcon.backgroundColor`.
- Notification icon on Android 5+ is rendered white-on-transparent automatically by the OS. The colour in `notification-icon.svg` is preserved for older Android versions and for in-app preview.

## Colours used

| Hex       | Use                                       |
| --------- | ----------------------------------------- |
| `#F5F0E8` | Warm sand background                      |
| `#3B6D11` | Forest green primary (compass ring + dot) |
| `#639922` | Light green accent (outer dots)           |
| `#2C2C2A` | Dark text ("ACT")                         |
| `#5F5E5A` | Muted text (subtitle)                     |
| `#888780` | Subtle text (tagline)                     |

Flat only — no gradients, no shadows, no filters. See `.claude/rules/frontend.md` for full design system.
