import '../global.css';

import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash already hidden or unavailable (e.g. web) — safe to ignore.
});

WebBrowser.maybeCompleteAuthSession();

import { Noodknop } from '@/components/emergency/Noodknop';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { SessionPolicyProvider } from '@/providers/SessionPolicyProvider';

/**
 * Root layout — wraps the entire app.
 *
 * Provider order matters:
 *   - QueryProvider outermost so AuthProvider can use queries if it ever needs to.
 *   - AuthProvider next so any screen / Noodknop can read the session.
 *   - Stack inside so screens can navigate via expo-router.
 *
 * Non-negotiables enforced here (CLAUDE.md):
 *   - Noodknop is mounted at root → visible on every screen, no auth check.
 *   - `actapp://` deep links are handled inside AuthProvider for magic-link auth.
 */
export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // Non-fatal if splash was already dismissed.
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <SessionPolicyProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(public)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <Noodknop />
              <StatusBar style="dark" backgroundColor="#F5F0E8" />
            </SessionPolicyProvider>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
