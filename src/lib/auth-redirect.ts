import { makeRedirectUri } from 'expo-auth-session';

/**
 * Redirect URL passed to Supabase `signInWithOtp`.
 *
 * Production builds use the HTTPS bridge edge function (mobile browsers cannot
 * open actapp:// from an email link). Dev / Expo Go falls back to makeRedirectUri.
 *
 * Must be listed in Supabase → Authentication → URL Configuration.
 */
export function getAuthRedirectUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_AUTH_CALLBACK_URL?.trim();
  if (explicit) return explicit;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl && !__DEV__) {
    return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/auth-callback`;
  }

  return makeRedirectUri({
    scheme: 'actapp',
    path: 'auth/callback',
  });
}
