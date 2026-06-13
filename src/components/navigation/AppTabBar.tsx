import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_CHROME, leftChromeReserve, rightChromeReserve } from '@/lib/bottom-chrome';

const VISIBLE_TAB_ROUTES = new Set(['home/index', 'modules']);

/**
 * Centered two-tab bar with side reserves for Noodknop (left) and chat FAB (right).
 */
export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TAB_ROUTES.has(route.name));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: BOTTOM_CHROME.tabBarHeight + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: '#F5F0E8',
        borderTopWidth: 1,
        borderTopColor: '#D3D1C7',
      }}
    >
      <View style={{ width: leftChromeReserve() }} />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: BOTTOM_CHROME.tabGap,
        }}
      >
        {visibleRoutes.map((route) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;

          const { options } = descriptor;
          const label = options.title ?? route.name;
          const isFocused = state.index === state.routes.indexOf(route);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const color = isFocused ? '#3B6D11' : '#888780';

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              style={{
                minWidth: 72,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              {options.tabBarIcon?.({
                focused: isFocused,
                color,
                size: 24,
              }) ?? <Ionicons name="ellipse-outline" size={24} color={color} />}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ width: rightChromeReserve() }} />
    </View>
  );
}
