import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

/**
 * Root route — redirects based on auth state.
 *
 * The Expo splash screen stays up until this component mounts. The brief
 * spinner only matters for cold starts where the secure-storage read is slow.
 */
export default function IndexScreen() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  return <Redirect href={session ? '/home' : '/login'} />;
}
