import * as Linking from 'expo-linking';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Magic-link callback screen.
 *
 * Handles two flows:
 *   1. PKCE (Supabase v2 default): URL contains `?code=xxxx`. We call
 *      `exchangeCodeForSession` here as a fallback for cold-start deep links
 *      where AuthProvider's listener hasn't fired yet.
 *   2. Implicit: tokens are already set by AuthProvider's deep-link listener
 *      before this screen mounts — just redirect.
 *
 * The `exchanged` ref prevents a double exchange when AuthProvider and this
 * screen race on the same code.
 */
export default function AuthCallbackScreen() {
  const { session, loading } = useAuth();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const exchanged = useRef(false);

  useEffect(() => {
    if (!code || exchanged.current) return;
    exchanged.current = true;

    const callbackUrl = Linking.createURL('/auth/callback', {
      queryParams: { code },
    });
    supabase.auth.exchangeCodeForSession(callbackUrl).catch(() => {
      // Ignore — AuthProvider may have already exchanged it.
    });
  }, [code]);

  if (loading || (code && !session)) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-3">
        <ActivityIndicator color="#3B6D11" />
        <Text className="text-sm text-text-muted">Inloggen…</Text>
      </View>
    );
  }

  return <Redirect href={session ? '/home' : '/login?error=auth'} />;
}
