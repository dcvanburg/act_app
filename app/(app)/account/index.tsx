import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';

/**
 * /account — placeholder until α6.
 *
 * α6 brings profile edit (first/last/phone) + GDPR account deletion. For now
 * we just expose the email + a sign-out button so the link from /home doesn't
 * 404 and the Expo Router typed-routes definition is happy.
 */
export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <View style={{ paddingTop: insets.top + 24 }} className="flex-1 bg-background px-6">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Terug"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        className="mb-4 self-start"
      >
        <Text className="text-sm text-text-muted">← Terug</Text>
      </Pressable>

      <Text className="font-serif text-2xl font-bold text-text">Mijn account</Text>
      <Text className="mt-2 text-sm text-text-subtle">{user?.email ?? '—'}</Text>

      <View className="mt-8 rounded-2xl bg-surface p-5 shadow-sm">
        <Text className="font-serif text-base font-semibold text-text">In ontwikkeling</Text>
        <Text className="mt-2 text-sm text-text-muted">
          Profiel bewerken en account verwijderen worden in α6 toegevoegd.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => signOut()}
        className="mt-6 rounded-lg border border-border px-4 py-3 active:bg-surface-muted"
      >
        <Text className="text-center text-sm font-medium text-text-muted">Uitloggen</Text>
      </Pressable>
    </View>
  );
}
