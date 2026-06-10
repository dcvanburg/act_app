import { Stack } from 'expo-router';

/**
 * Modules tab uses an inner stack so /modules/[id] pushes on top of the overview.
 * router.back() from a module then returns to /modules, not the Home tab.
 */
export default function ModulesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
