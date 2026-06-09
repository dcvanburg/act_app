# E2E tests (Maestro)

End-to-end smoke tests for the Expo app, run via [Maestro](https://maestro.mobile.dev).

## Run

```bash
# Prerequisite: Maestro installed locally (https://maestro.mobile.dev/getting-started/installing-maestro)
# Prerequisite: iOS simulator or Android emulator running with the dev build installed

npm run test:e2e
```

## Layout

- `.maestro/smoke.yaml` — verifies the app launches and the Noodknop is visible (α1 placeholder; expands in α3 once the crisis screen ships)

## Adding a flow

1. Create a new `.maestro/<flow-name>.yaml`
2. Reference the screen IDs by visible text or `testID` prop
3. Add the file to CI in `.github/workflows/ci.yml` once flows stabilise (deferred — see [docs/OPEN_QUESTIONS.md](../docs/OPEN_QUESTIONS.md))

CI integration is intentionally deferred — Maestro requires a simulator/emulator runner which costs CI minutes. We will enable it on PRs touching `app/**` after the critical-path flows (auth, onboarding, crisis, module unlock) are scripted.
