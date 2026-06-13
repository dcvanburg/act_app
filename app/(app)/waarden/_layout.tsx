import { Stack } from 'expo-router';

/**
 * Inner stack so /waarden/[id] pushes on top of the overview.
 * router.back() from a waarde then returns to /waarden, not Home.
 */
export default function WaardenLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
