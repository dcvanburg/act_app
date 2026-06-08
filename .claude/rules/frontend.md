---
paths:
  - "src/**/*.{tsx,css}"
  - "app/**/*.{tsx,css}"
---

# Frontend Patterns

- Mobile-first responsive layout (primary use on phones)
- Emergency button: `position: fixed`, always visible, min 44px touch target
- Accessible: focus states, `aria-label` in Dutch, semantic HTML
- Module screens (active flow): paginated, one screen at a time, clear step indicator (X of N), pause/resume without data loss
- Module screens (revisit): single scrollable page — no pagination, no step tracking
- Body exercises: **text-only in v1** — render transcript as body text. No audio player. When `audioUrl !== null` in a future sprint, add the player then.
- Calm, non-clinical visual tone — avoid alarmist colors except crisis screen

## Brand & design tokens

Based on Praktijk Vitalis identity — confirmed 2026-06-08. Refine hex values against live site before design polish pass.

| Token | Value | Use |
|-------|-------|-----|
| `primary` | `#2A9D8F` | Buttons, active states, links, progress bar |
| `primary-dark` | `#1F7A6E` | Hover / pressed states |
| `text` | `#1A2B2F` | Body copy, headings |
| `background` | `#F7FAF9` | Page background (cool off-white) |
| `surface` | `#FFFFFF` | Cards, module panels |
| `border` | `#D1E3E0` | Dividers, input borders |
| `crisis` | `#C25B2B` | Crisis screen accent only — never use as general UI color |

**Tailwind config** (`tailwind.config.ts`):
```ts
colors: {
  primary: { DEFAULT: '#2A9D8F', dark: '#1F7A6E' },
  crisis:  '#C25B2B',
}
```

**shadcn/ui CSS variables** (`globals.css`):
```css
:root {
  --primary:        173 58% 39%;   /* #2A9D8F */
  --primary-foreground: 0 0% 100%;
  --background:     160 20% 97%;   /* #F7FAF9 */
  --foreground:     190 26% 14%;   /* #1A2B2F */
}
```

Do not use red (`#EF4444` / Tailwind `red-*`) in therapeutic UI — use amber/orange tones only. Red is reserved for system errors outside the therapeutic flow.
