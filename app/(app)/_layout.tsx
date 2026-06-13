import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatFloatingButton } from '@/components/chat/ChatFloatingButton';
import common from '@/content/nl/common.json';
import { resolveAppBootstrapTarget } from '@/lib/auth-bootstrap';
import { useProfile } from '@/lib/profile-queries';
import { defaultTabBarStyle } from '@/lib/tab-bar';
import { useAuth } from '@/providers/AuthProvider';
import {
  UnsavedChangesGuardProvider,
  useUnsavedChangesGuard,
} from '@/providers/UnsavedChangesGuardProvider';
import { WaardenProvider } from '@/providers/WaardenProvider';

/**
 * Auth-required route group with bottom tabs: Home + Modules.
 *
 * Bootstrap gate (session + profile) runs here before tabs render so users with
 * an expired session see login, and new users see /wizard without a home flash.
 */
export default function AppLayout() {
  const { session, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const target = resolveAppBootstrapTarget({
    authLoading,
    hasSession: Boolean(session),
    profileLoading,
    profileFirstName: profile?.first_name,
    pathname,
  });

  if (target === 'loading') {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ flex: 1, backgroundColor: '#F5F0E8' }}
      >
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  if (target === 'login') {
    return <Redirect href="/login" />;
  }

  return (
    <WaardenProvider>
      <UnsavedChangesGuardProvider>
        {target === 'wizard' ? <Redirect href="/wizard" /> : null}
        {profile?.first_name?.trim() && pathname === '/wizard' ? <Redirect href="/home" /> : null}
        <AppTabs insets={insets} />
      </UnsavedChangesGuardProvider>
    </WaardenProvider>
  );
}

function AppTabs({ insets }: { insets: { bottom: number } }) {
  const router = useRouter();
  const { handleTabPress } = useUnsavedChangesGuard();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#3B6D11',
          tabBarInactiveTintColor: '#888780',
          tabBarStyle: defaultTabBarStyle(insets.bottom),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
      <Tabs.Screen
        name="home/index"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress(() => router.navigate('/home'));
          },
        }}
        options={{
          title: common.nav.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="modules"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleTabPress(() => router.navigate('/modules'));
          },
        }}
        options={{
          title: common.nav.modules,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="wizard" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="onboarding/index" options={{ href: null }} />
      <Tabs.Screen name="account/index" options={{ href: null }} />
      <Tabs.Screen name="mood/index" options={{ href: null }} />
      <Tabs.Screen name="mood/history" options={{ href: null }} />
      <Tabs.Screen name="waarden" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      </Tabs>
      <ChatFloatingButton />
    </View>
  );
}
