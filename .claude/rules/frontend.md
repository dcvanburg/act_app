---
paths:
  - 'src/**/*.{tsx,css}'
  - 'app/**/*.{tsx,css}'
  - 'assets/src/*.svg'
---

# Frontend Patterns

- Mobile-first (Expo / React Native). Primary use on phones; iPad / tablet support deferred.
- Emergency button (`Noodknop`): always-visible overlay in `app/_layout.tsx`, bottom-left. Min 44pt touch target.
- Chat floating button (`ChatFloatingButton`): always-visible on authenticated screens in `app/(app)/_layout.tsx`, bottom-right.
- Accessible: focus states (RN: `accessibilityState`), `accessibilityLabel` in Dutch, semantic component naming.
- Module screens (active flow): paginated, one screen at a time, clear step indicator (X of N), pause/resume without data loss.
- Module screens (revisit): single scrollable page — no pagination, no step tracking.
- Body exercises: **text-only in v1** — render transcript as body text. No audio player. When `audioUrl !== null` in a future sprint, add the player then.
- Calm, non-clinical visual tone — avoid alarmist colours except crisis screen.

## Brand & design tokens (updated 2026-06-09)

Earthy, warm palette: forest green + warm sand + accent green. Replaces the earlier teal `#2A9D8F` palette. Reflects the ACT theme of grounded, growing, calm presence.

| Token                 | Value     | Use                                                            |
| --------------------- | --------- | -------------------------------------------------------------- |
| `primary`             | `#3B6D11` | Buttons, active states, links, compass icon, progress bar      |
| `primary-dark`        | `#27500A` | Hover / pressed states                                         |
| `primary-soft`        | `#EAF3DE` | Filled tag chips, success-tinted card backgrounds              |
| `primary-border-soft` | `#C0DD97` | Border on soft-primary chips/cards                             |
| `secondary`           | `#639922` | Compass accent dots, secondary highlights                      |
| `text`                | `#2C2C2A` | Body copy, headings                                            |
| `text-muted`          | `#888780` | Captions, hint text, secondary labels                          |
| `text-subtle`         | `#5F5E5A` | Subtitle / tertiary copy                                       |
| `background`          | `#F5F0E8` | Page background (warm sand)                                    |
| `surface`             | `#FFFFFF` | Cards, module panels                                           |
| `surface-muted`       | `#F1EFE8` | Locked module cards, neutral stat cards                        |
| `border`              | `#D3D1C7` | Dividers, input borders, card borders                          |
| `locked`              | `#B4B2A9` | Locked module icon / number                                    |
| `crisis`              | `#D85A30` | Noodknop pill background, emergency dot                        |
| `crisis-dark`         | `#993C1D` | Noodknop / emergency text                                      |
| `crisis-soft`         | `#FFF8F5` | Emergency-card background (non-noodknop, e.g. in-line warning) |
| `crisis-border`       | `#F5C4B3` | Border on crisis-soft cards                                    |

## NativeWind config (target — lands with α1)

```ts
// tailwind.config.ts (Expo)
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{tsx,ts}', './src/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B6D11',
          dark: '#27500A',
          soft: '#EAF3DE',
        },
        secondary: '#639922',
        background: '#F5F0E8',
        surface: { DEFAULT: '#FFFFFF', muted: '#F1EFE8' },
        text: { DEFAULT: '#2C2C2A', muted: '#888780', subtle: '#5F5E5A' },
        border: '#D3D1C7',
        locked: '#B4B2A9',
        crisis: {
          DEFAULT: '#D85A30',
          dark: '#993C1D',
          soft: '#FFF8F5',
          border: '#F5C4B3',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['System'],
      },
    },
  },
  plugins: [],
};

export default config;
```

## Rules

- Do NOT use Tailwind `red-*` in therapeutic UI. Crisis tones come from `crisis.*` only — they are a controlled, warm orange-red, never alarmist scarlet.
- Do NOT use teal `#2A9D8F` — that palette is deprecated. Anything older referencing teal must be migrated.
- Compass / hexaflex motif (`assets/src/icon.svg`) is the brand mark. Reuse the geometry (8 spokes, central dot, outer dots) consistently in any in-app illustration.
- All flat — no gradients, no drop shadows beyond a single subtle elevation, no glow.
