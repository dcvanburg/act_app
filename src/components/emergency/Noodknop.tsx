import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import common from '@/content/nl/common.json';

/**
 * Noodknop — emergency overlay, mounted in the root layout.
 *
 * Non-negotiable: visible on every screen, min 44pt touch target,
 * routes to /noodhulp without any auth check. See CLAUDE.md.
 *
 * When the user is already on /noodhulp tapping the Noodknop is a no-op —
 * we don't stack another /noodhulp on top of itself. The pill stays visible
 * so the affordance is consistent across screens.
 */
export function Noodknop() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isOnNoodhulp = pathname === '/noodhulp';

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
        accessibilityState={{ disabled: isOnNoodhulp }}
        onPress={() => {
          if (isOnNoodhulp) return;
          router.push('/noodhulp');
        }}
        className="flex-row items-center gap-2 rounded-full bg-crisis px-4 py-3 shadow-lg active:bg-crisis-dark"
        style={{ minHeight: 44 }}
      >
        <View className="h-2 w-2 rounded-full bg-white" />
        <Text className="text-sm font-semibold text-white">{common.emergency.buttonLabel}</Text>
      </Pressable>
    </View>
  );
}
