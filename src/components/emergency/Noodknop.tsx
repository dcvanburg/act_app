import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import common from '@/content/nl/common.json';

/**
 * Noodknop — emergency overlay, mounted in the root layout.
 *
 * Non-negotiable: visible on every screen, min 44pt touch target,
 * routes to /noodhulp without any auth check. See CLAUDE.md.
 *
 * α1 stub: renders the pill in the right place; tapping it pushes /noodhulp,
 * which is implemented in α3.
 */
export function Noodknop() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + 16,
        alignItems: 'flex-end',
        paddingHorizontal: 16,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={common.emergency.buttonLabel}
        onPress={() => router.push('/noodhulp')}
        className="flex-row items-center gap-2 rounded-full bg-crisis px-4 py-3 shadow-lg active:bg-crisis-dark"
        style={{ minHeight: 44 }}
      >
        <View className="h-2 w-2 rounded-full bg-white" />
        <Text className="text-sm font-semibold text-white">{common.emergency.buttonLabel}</Text>
      </Pressable>
    </View>
  );
}
