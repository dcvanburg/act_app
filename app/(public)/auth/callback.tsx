import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { createSessionFromUrl } from '@/lib/auth-callback';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Magic-link callback screen.
 *
 * AuthProvider handles the deep link via `useLinkingURL`; this screen is a
 * fallback when Expo Router lands here before the provider finishes, and
 * shows loading / error UI while the session is established.
 */
export default function AuthCallbackScreen() {
  const { session, loading } = useAuth();
  const linkingUrl = Linking.useLinkingURL();
  const [authFailed, setAuthFailed] = useState(false);
  const exchanged = useRef(false);

  useEffect(() => {
    if (!linkingUrl || exchanged.current || session) return;
    exchanged.current = true;

    createSessionFromUrl(linkingUrl)
      .then((nextSession) => {
        if (!nextSession) setAuthFailed(true);
      })
      .catch(() => {
        exchanged.current = false;
        setAuthFailed(true);
      });
  }, [linkingUrl, session]);

  if (!authFailed && (loading || (linkingUrl && !session))) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-3">
        <ActivityIndicator color="#3B6D11" />
        <Text className="text-sm text-text-muted">Inloggen…</Text>
      </View>
    );
  }

  return <Redirect href={session ? '/home' : '/login?error=auth'} />;
}
