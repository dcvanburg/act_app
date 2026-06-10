import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

/** Shared tab bar chrome — keep in sync with app/(app)/_layout.tsx screenOptions. */
export function defaultTabBarStyle(
  bottomInset: number,
): NonNullable<BottomTabNavigationOptions['tabBarStyle']> {
  return {
    display: 'flex',
    backgroundColor: '#F5F0E8',
    borderTopColor: '#D3D1C7',
    height: 56 + bottomInset,
    paddingBottom: bottomInset,
    paddingTop: 8,
  };
}

export const hiddenTabBarStyle: NonNullable<BottomTabNavigationOptions['tabBarStyle']> = {
  display: 'none',
};
