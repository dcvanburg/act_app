import { Stack, useGlobalSearchParams, useNavigation, usePathname } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { defaultTabBarStyle, hiddenTabBarStyle } from '@/lib/tab-bar';

/**
 * Modules tab uses an inner stack so /modules/[id] pushes on top of the overview.
 * router.back() from a module then returns to /modules, not the Home tab.
 *
 * Restores the bottom tab bar whenever this stack is focused, except during the
 * first-login onboarding leg (/modules/onboarding?from=onboarding). Setting
 * tabBarStyle to undefined on cleanup does not undo display:none — we must
 * re-apply the default style explicitly.
 */
export default function ModulesLayout() {
  const navigation = useNavigation();
  const pathname = usePathname();
  const { from } = useGlobalSearchParams<{ from?: string }>();
  const insets = useSafeAreaInsets();

  const hideTabBar = pathname === '/modules/onboarding' && from === 'onboarding';

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: hideTabBar ? hiddenTabBarStyle : defaultTabBarStyle(insets.bottom),
      });

      return () => {
        navigation.getParent()?.setOptions({
          tabBarStyle: defaultTabBarStyle(insets.bottom),
        });
      };
    }, [navigation, hideTabBar, insets.bottom]),
  );

  return <Stack screenOptions={{ headerShown: false }} />;
}
