# Supabase Auth Setup — Magic Link Login

Required once per Supabase project. Without this, email links open the browser
but never return to the app.

## 1. Deploy the HTTPS bridge function

The bridge shows an **Open de app** button after the user taps the email link.

```bash
npx supabase link --project-ref atscybinltwlaaucthsl
npx supabase functions deploy auth-callback --no-verify-jwt
```

Note the function URL:

```
https://atscybinltwlaaucthsl.supabase.co/functions/v1/auth-callback
```

## 2. Redirect URLs (Supabase Dashboard)

**Authentication → URL Configuration → Redirect URLs** — add:

| URL | When |
| --- | ---- |
| `https://atscybinltwlaaucthsl.supabase.co/functions/v1/auth-callback` | Production / TestFlight / Play builds |
| `actapp://**` | Fallback deep link |
| `exp://**` | Expo Go local dev only |

## 3. Email template (optional OTP code)

**Authentication → Email Templates → Magic Link**

Default template only contains a link. To also send a 6-digit code (in-app
fallback on `/login`), add:

```html
<h2>Inloggen</h2>
<p>Je inlogcode: <strong>{{ .Token }}</strong></p>
<p>Of tik op deze link:</p>
<p><a href="{{ .ConfirmationURL }}">Inloggen</a></p>
```

## 4. App environment

`.env.local` (already required):

```
EXPO_PUBLIC_SUPABASE_URL=https://atscybinltwlaaucthsl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional override:

```
EXPO_PUBLIC_AUTH_CALLBACK_URL=https://atscybinltwlaaucthsl.supabase.co/functions/v1/auth-callback
```

Production builds pick the bridge URL automatically from `EXPO_PUBLIC_SUPABASE_URL`.

## Expected login flow

1. User enters email in app → receives email
2. User taps link → brief browser page (**Bijna ingelogd**)
3. User taps **Open de app** → app opens on `/auth/callback` → `/home`
