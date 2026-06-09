import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

/**
 * Magic-link callback screen.
 *
 * The actual token exchange happens inside AuthProvider's deep-link listener
 * — by the time this screen mounts the session is usually already set.
 *
 * This screen shows a brief loading indicator and then redirects based on the
 * session state AuthProvider has populated.
 */
export default function AuthCallbackScreen() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-3">
        <ActivityIndicator color="#3B6D11" />
        <Text className="text-sm text-text-muted">Inloggen…</Text>
      </View>
    );
  }

  // After AuthProvider has parsed the magic-link tokens, session is set.
  // If it isn't, the link was invalid / expired — send the user back to login
  // with an error hint.
  return <Redirect href={session ? '/home' : '/login?error=auth'} />;
}
