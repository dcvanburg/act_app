import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

/**
 * Auth-required route group.
 *
 * Every screen under this group requires an active Supabase session. If the
 * session is missing, the user is redirected to /login.
 *
 * `/noodhulp` is intentionally NOT in this group — crisis access never depends
 * on auth state.
 */
export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
