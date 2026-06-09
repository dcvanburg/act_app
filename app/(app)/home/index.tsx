import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import common from '@/content/nl/common.json';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Home screen — α2 placeholder.
 *
 * α4 will replace this with the real ProgramOverview (8 modules + unlock state).
 * For now it confirms the session is live and gives a sign-out affordance for
 * iteration.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  return (
    <View style={{ paddingTop: insets.top + 24 }} className="flex-1 bg-background px-6">
      <Text className="font-serif text-2xl font-bold text-text">{common.app.name}</Text>
      <Text className="mt-1 text-sm text-text-subtle">Ingelogd als {user?.email ?? '—'}</Text>

      <View className="mt-8 rounded-2xl bg-surface p-5 shadow-sm">
        <Text className="font-serif text-lg font-semibold text-text">Bijna klaar</Text>
        <Text className="mt-2 text-sm text-text-muted">
          De moduleweergave en het programma-overzicht worden in α4 toegevoegd. Voor nu kun je
          uitloggen en je magic-link flow testen.
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
