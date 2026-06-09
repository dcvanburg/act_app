import { Stack } from 'expo-router';

/**
 * Public route group — login, magic-link callback, /noodhulp (lands in α3).
 *
 * `/noodhulp` is intentionally placed under `(public)` so it bypasses every
 * auth check. Crisis access is non-negotiable per CLAUDE.md.
 *
 * Per-screen redirects (e.g. "logged-in user visits /login → send them home")
 * live inside the screens themselves rather than this layout — Expo Router's
 * Stack.Screen has no declarative `redirect` like Tabs does.
 */
export default function PublicLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
