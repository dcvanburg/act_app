import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

import { BOTTOM_CHROME } from '@/lib/bottom-chrome';

/** Shared tab bar chrome — keep in sync with AppTabBar and app/(app)/_layout.tsx. */
export function defaultTabBarStyle(
  bottomInset: number,
): NonNullable<BottomTabNavigationOptions['tabBarStyle']> {
  return {
    display: 'flex',
    backgroundColor: '#F5F0E8',
    borderTopColor: '#D3D1C7',
    height: BOTTOM_CHROME.tabBarHeight + bottomInset,
    paddingBottom: bottomInset,
  };
}

export const hiddenTabBarStyle: NonNullable<BottomTabNavigationOptions['tabBarStyle']> = {
  display: 'none',
};
