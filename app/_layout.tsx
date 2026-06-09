import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Noodknop } from '@/components/emergency/Noodknop';

/**
 * Root layout — wraps the entire app.
 *
 * Three guarantees enforced here (see CLAUDE.md non-negotiables):
 *   1. The Noodknop overlay is mounted at the root so it sits above every screen.
 *   2. The status bar uses the warm-sand theme.
 *   3. GestureHandlerRootView wraps everything so reanimated/RN-gesture-handler work.
 *
 * Auth provider, TanStack Query provider, and route guards land in α2.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <Noodknop />
        <StatusBar style="dark" backgroundColor="#F5F0E8" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
