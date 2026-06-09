import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import common from '@/content/nl/common.json';

/**
 * Placeholder landing screen.
 *
 * This is α1 scaffold only — auth gating, magic-link login, and routing to /home
 * land in α2. For now this screen simply confirms the Expo scaffold is wired up
 * and Dutch content is reachable from the JSON content layer.
 */
export default function IndexScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="flex-1 items-center justify-center bg-background p-6"
    >
      <View className="w-full max-w-md items-center">
        <Text className="mb-2 font-serif text-3xl font-bold text-text">{common.app.name}</Text>
        <Text className="mb-8 text-center text-base text-text-subtle">{common.app.tagline}</Text>
        <Text className="text-center text-sm text-text-muted">
          Expo scaffold ready — auth + program flow land in α2 / α4.
        </Text>
      </View>
    </View>
  );
}
