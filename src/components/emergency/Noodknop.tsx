import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlarmBellIcon } from '@/components/icons/AlarmBellIcon';
import common from '@/content/nl/common.json';
import { BOTTOM_CHROME, fabBottomOffset } from '@/lib/bottom-chrome';

/**
 * Noodknop — emergency overlay, mounted in the root layout.
 *
 * Always a compact circle with an alarm bell icon (min 44pt touch target).
 * Routes to /noodhulp without any auth check. See CLAUDE.md.
 */
export function Noodknop() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const { from } = useGlobalSearchParams<{ from?: string }>();
  const isOnNoodhulp = pathname === '/noodhulp';

  // Hidden during the full onboarding flow (personal data screen + all sequential steps).
  if (pathname === '/wizard' || pathname === '/onboarding' || from === 'onboarding') return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: fabBottomOffset(insets.bottom, BOTTOM_CHROME.noodknopSize),
        alignItems: 'flex-start',
        paddingHorizontal: BOTTOM_CHROME.edgePadding,
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
        className="h-11 w-11 items-center justify-center rounded-full bg-crisis shadow-lg active:bg-crisis-dark"
        style={{ minHeight: 44, minWidth: 44 }}
      >
        <AlarmBellIcon size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
