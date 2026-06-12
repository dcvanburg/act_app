# Technical Specification

> Functional requirements from ACT App Concept v1.0, translated for development.

## Core features (v1)

| Feature                                    | Priority  | Notes                                                                         |
| ------------------------------------------ | --------- | ----------------------------------------------------------------------------- |
| User profile with progress persistence     | P0        | Which modules completed; resume state                                         |
| Linear module path with back-navigation    | P0        | See [NAVIGATION.md](./NAVIGATION.md)                                          |
| Onboarding intake with complaint selection | P0        | pain / mental / alcohol / combination                                         |
| Contextual back-references within modules  | P1        | Links to prior modules                                                        |
| Audio for body-oriented exercises          | Out of v1 | Text-only in v1; `audioUrl` stays `null`; transcripts displayed as body text  |
| Journal with simple input                  | P1        | Available after program completion                                            |
| Push notifications for daily check-in      | Out of v1 | Skip entirely; revisit after pilot                                            |
| Emergency button                           | P0        | Fixed UI position; always reachable                                           |
| Subscription tier placeholder              | P0-infra  | `subscriptionTier` field on profile (value: `'free'`); no paywall logic in v1 |
| Account deletion (GDPR)                    | P1        | In-app "Verwijder mijn account" + documented email fallback                   |

## Navigation logic

```
Module 0 (onboarding):  always available
Module 1:               available after module 0 complete
Module N:               available after module N-1 complete
Completed modules:      always revisitable (read-only or full replay — TBD)
Daily practice:         available after module 7 complete
```

### Module completion trigger

A module's status transitions to `completed` **automatically when the user reaches the final screen** of that module. No explicit "Afronden" button tap is required. The transition fires on mount of the last screen component.

### In-module pagination and save-and-resume

Each module is split into discrete **screens** (paginated, not a single long scroll). Each screen has a unique string ID (e.g. `"intro"`, `"avoidance-cycle"`, `"body-exercise"`).

- `lastStepId` stores the ID of the **last screen the user reached** in that module.
- On resume, the module opens directly at the stored `lastStepId` screen.
- Screens are defined in the module's content JSON under a `screens` array (to be added when scaffold is built).
- The final screen triggers the `completed` status transition (see above).

### Progress model (suggested)

> Types are defined in `src/types/content.ts` — keep in sync.

```typescript
// import { ComplaintType, ModuleId, ModuleStatus } from '@/types/content';

type ModuleProgress = {
  moduleId: ModuleId; // string ID e.g. 'recognition', 'acceptance' — NOT numeric
  status: ModuleStatus; // 'locked' | 'available' | 'in_progress' | 'completed'
  startedAt?: string;
  completedAt?: string;
  lastStepId?: string; // for save-and-resume within module
};

type UserProgress = {
  intake: {
    complaintTypes: ComplaintType[];
    completedAt?: string;
  };
  safetyCheckPassed: boolean;
  modules: ModuleProgress[];
  dailyPracticeUnlocked: boolean;
};
```

## Emergency button flow

1. Always visible (fixed position — e.g. bottom corner or app bar)
2. One tap → grounding/breath exercise (no navigation depth)
3. Does not reset module progress
4. Optional: from safety intake failure, show crisis resources

## Safety & ethics

### App boundaries (must be communicated in Dutch UI)

The app is **not** a replacement for professional help in:

- Acute suicidality or self-harm
- Severe psychiatric conditions
- Severe addiction without professional support

### Crisis referral (Netherlands)

When intake or in-app signals indicate crisis, show:

| Resource   | Contact                         |
| ---------- | ------------------------------- |
| Huisarts   | User's own GP                   |
| GGZ        | Regional mental health services |
| Crisislijn | 0800-0113                       |

Implement as a dedicated **crisis screen** (`/noodhulp` or modal) — never hide behind paywall or login.

### Safety check (onboarding)

- Screening questions during intake (content TBD by therapist)
- If triggered: block program start, show referral screen
- Log event locally only (no PII to third parties without consent)

## Audio requirements

- Guided body exercises per module
- Format: MP3 or WebM; hosted on CDN or app static assets
- Playback: pause/resume, background-friendly on mobile
- Accessibility: transcript in Dutch for each audio exercise

## Notifications (P2)

- Opt-in only (GDPR)
- Weekly values check-in reminder
- No guilt-framed copy — align with ACT philosophy

## Non-functional requirements

| Area          | Requirement                                                        |
| ------------- | ------------------------------------------------------------------ |
| Language      | UI: Dutch (`nl-NL`). Code: English                                 |
| Accessibility | WCAG 2.1 AA target; screen reader for exercises                    |
| Privacy       | GDPR; minimal data collection; EU hosting preferred                |
| Offline       | PWA offline for emergency button + completed module text (stretch) |
| URL access    | Public URL; no app store required for v1                           |

## Completed module revisit

When a user navigates back to a module with status `completed`:

- Render as a **single scrollable page** — no pagination, no step tracking
- All sections, body exercise transcript, and practical task visible at once
- `status` remains `completed`; `lastStepId` is not updated during revisit
- Read-only: no "Afronden" trigger fires again

## Body exercise rendering (v1 — text-only)

No audio player is built in v1. `audioUrl` in all content JSON files is `null`.

Body exercise screens render:

1. Exercise title and description
2. Transcript text (Dutch) as the full exercise content
3. When `audioUrl` is `null`, transcript is shown directly — no player UI, no placeholder

When audio is added in a future sprint, the component will check `audioUrl !== null` and show the player alongside the transcript.

## Intake personalization — conditional paragraph pattern

Users select complaint types during intake (stored in `UserProgress.intake.complaintTypes`). Module sections can include complaint-specific example text alongside their main body.

### Content JSON structure

```json
{
  "id": "avoidance-cycle",
  "title": "De vermijdingscirkel",
  "body": "Iedereen kent dit patroon: ...",
  "examples": {
    "pain": "[PLACEHOLDER — voorbeeld bij chronische pijn]",
    "mental": "[PLACEHOLDER — voorbeeld bij angst/burn-out]",
    "alcohol": "[PLACEHOLDER — voorbeeld bij verslavingsklachten]",
    "combination": "[PLACEHOLDER — voorbeeld bij combinatie]"
  }
}
```

### Rendering rule

- If `examples` is present and the user's `complaintTypes` includes a matching key, show that example below the main `body`.
- If `complaintTypes` includes `'combination'`, show the `combination` example.
- If no match, show nothing (examples are always additive — never replace body text).
- `examples` is optional on every section; most sections will not have it.

See `src/types/content.ts` → `ConditionalExamples` and `docs/CONTENT_PLACEHOLDERS.md` for which sections need examples.

## Account deletion (GDPR — right to erasure)

- **In-app:** Settings screen includes a `Verwijder mijn account` button. Confirms via a modal, then calls Supabase DELETE on the `profiles` row (cascades to all progress, journal, intake data).
- **Email fallback:** Privacy policy documents a deletion-by-email route for users who cannot access the in-app flow.
- Session is invalidated immediately on deletion.

## RAG chatbot (under design — see [ADR-005](./ADR/005-rag-chatbot.md))

A scoped Q&A chatbot is in design for v1. It retrieves from a Supabase pgvector + Dutch FTS index of therapist-approved content and synthesises short Dutch summaries via Claude Haiku 4.5. It is **not** a therapeutic agent — see [PRODUCT.md → Chatbot](./PRODUCT.md#chatbot-under-design--see-adr-005) and [SECURITY.md → AI processing](./SECURITY.md#ai-processing--llm-rag) for the constraints.

Non-negotiables that affect downstream specs:

- Crisis keyword pre-filter runs **client-side and server-side** before any LLM call. Crisis signals route to `/noodhulp`.
- Chat history is **in-memory only**. The `chat_sessions` table stores at most a counter — no message bodies.
- Edge Function requires a valid Supabase JWT — no anonymous use.
- Therapist sign-off on the system prompt and ingested content before pilot.

Implementation phased into four PRs (database → Edge Functions → client → content ingest). Decisions outstanding: OPEN_QUESTIONS #19–24.

## Out of scope (v1)

- Therapist dashboard / clinician portal
- Multi-user accounts with social features
- Payment / subscription (unless decided otherwise)
- Novel AI-generated therapeutic content (the chatbot in ADR-005 only summarises existing therapist-approved material — see that ADR for the boundary)
