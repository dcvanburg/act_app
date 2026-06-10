# Expo app configuration spec

This document captures the target `app.json` (or `app.config.ts`) for the Expo app. The file itself does NOT yet exist — it gets materialised in PR α1 when the Expo project is scaffolded. Until then, this spec is the authoritative source.

## Status

- **Decided 2026-06-09:** spec content below
- **Pending material:** Expo SDK ≥ 51 not installed yet (still Next.js)

## Target `app.json`

```json
{
  "expo": {
    "name": "ACT",
    "slug": "act-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "backgroundColor": "#F5F0E8",

    "splash": {
      "backgroundColor": "#F5F0E8",
      "resizeMode": "contain",
      "image": "./assets/splash.png"
    },

    "ios": {
      "bundleIdentifier": "nl.actapp.app",
      "buildNumber": "1",
      "supportsTablet": false,
      "infoPlist": {
        "NSFaceIDUsageDescription": "Voor veilige toegang tot je persoonlijke gegevens.",
        "ITSAppUsesNonExemptEncryption": false
      }
    },

    "android": {
      "package": "nl.actapp.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F5F0E8"
      }
    },

    "icon": "./assets/icon.png",

    "scheme": "actapp",

    "plugins": [
      "expo-font",
      "expo-local-authentication",
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#3B6D11"
        }
      ]
    ],

    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## Decisions baked into this spec (and where they come from)

| Field                              | Value             | Source / decision                                                                                                                     |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                             | `"ACT"`           | New brand, 2026-06-09. Supersedes working title "Van Overleven naar Leven" (OPEN_QUESTIONS #5)                                        |
| `slug`                             | `"act-app"`       | Matches repo                                                                                                                          |
| `bundleIdentifier` / `package`     | `"nl.actapp.app"` | Placeholder. May change once registered in App Store Connect (OPEN_QUESTIONS #16)                                                     |
| `scheme`                           | `"actapp"`        | Used for magic-link callback: `actapp://auth/callback`. Add to Supabase redirect URL allowlist before α2 ships                        |
| `userInterfaceStyle`               | `"light"`         | No dark mode in v1 (out of scope)                                                                                                     |
| `supportsTablet`                   | `false`           | Phone-only for v1                                                                                                                     |
| `orientation`                      | `"portrait"`      | All screens are portrait-locked                                                                                                       |
| `splash.backgroundColor`           | `#F5F0E8`         | Warm sand, matches `.claude/rules/frontend.md`                                                                                        |
| `expo-font` plugin                 | included          | Required if custom fonts ship; if Inter / Geist not used, can be removed                                                              |
| `expo-local-authentication` plugin | included          | **Decision 2026-06-09:** biometric (Face ID / fingerprint) is in scope. Reverses earlier "undecided" stance                           |
| `expo-notifications` plugin        | included          | **Decision 2026-06-09:** push notifications now in scope — **reverses OPEN_QUESTIONS #7** ("Skip push notifications entirely for v1") |
| `expo-secure-store` plugin         | included          | For Supabase access/refresh tokens; replaces cookie-based session from the Next.js setup                                              |
| `expo-router` plugin               | included          | File-based routing, decision from Phase 2 prep                                                                                        |
| `experiments.typedRoutes`          | `true`            | Compile-time typed routes via expo-router                                                                                             |

## Notably omitted

| Field                                | Why                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NSCameraUsageDescription`           | No camera feature in v1; omit until shipped                                                                                                                              |
| `NSMicrophoneUsageDescription`       | OPEN_QUESTIONS #13 — no audio in v1; **omitted** until audio recording or voice-note feature ships. Apple reviewers flag mic permissions without a corresponding feature |
| `NSPhotoLibraryUsageDescription`     | No photo picker in v1                                                                                                                                                    |
| `userTrackingUsageDescription`       | No tracking; no IDFA                                                                                                                                                     |
| `googleServicesFile`                 | No FCM yet — see below                                                                                                                                                   |
| Universal Links / Associated Domains | Deferred to post-v1                                                                                                                                                      |

## Push notification provider

`expo-notifications` ships with Expo's push service for development. For production:

| Platform | Provider      | What's needed before shipping                                                    |
| -------- | ------------- | -------------------------------------------------------------------------------- |
| iOS      | APNs via Expo | Apple Push Notification Service key from Apple Developer account → upload to EAS |
| Android  | FCM via Expo  | Firebase project + `google-services.json` → upload to EAS                        |

Both require a production Expo project ID. Set up during α2 or γ-10, whichever comes first.

## Migration notes from Next.js env

The Next.js app uses `NEXT_PUBLIC_*` for client-side env. Expo uses `EXPO_PUBLIC_*`. Rename in the Expo `.env.example`:

| Old                             | New                             |
| ------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `EXPO_PUBLIC_SUPABASE_URL`      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

## EAS Build configuration (target `eas.json`)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "TBD", "ascAppId": "TBD" },
      "android": { "serviceAccountKeyPath": "TBD" }
    }
  }
}
```

## When α1 lands

The α1 PR (`feature/expo-scaffold`) will:

1. Materialise `app.json` from this spec
2. Add the required assets: `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png`, `assets/notification-icon.png` — exported from `assets/src/*.svg` per `assets/src/EXPORT_INSTRUCTIONS.md`
3. Add the package.json scripts: `generate:assets`, `start`, `ios`, `android`, `eas-build`
4. Wire `expo-secure-store` + Supabase client per `docs/ADR/003-auth.md`
5. Register `actapp://auth/callback` as the deep-link callback
