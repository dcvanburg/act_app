import { makeRedirectUri } from 'expo-auth-session';

/**
 * Redirect URL for Supabase magic-link sign-in.
 *
 * Must be listed in Supabase → Authentication → URL Configuration.
 * Use wildcards: `actapp://**` and `exp://**` (Expo Go dev).
 */
export function getAuthRedirectUrl(): string {
  return makeRedirectUri({
    scheme: 'actapp',
    path: 'auth/callback',
  });
}
