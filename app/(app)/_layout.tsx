import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import common from '@/content/nl/common.json';
import { useProfile } from '@/lib/profile-queries';
import { useAuth } from '@/providers/AuthProvider';
import {
  UnsavedChangesGuardProvider,
  useUnsavedChangesGuard,
} from '@/providers/UnsavedChangesGuardProvider';
import { WaardenProvider } from '@/providers/WaardenProvider';

/**
 * Auth-required route group with bottom tabs: Home + Modules.
 *
 * Module detail, onboarding, account, and mood screens are hidden from the tab bar.
 * `/noodhulp` lives outside this group — crisis access never depends on auth.
 */
export default function AppLayout() {
  const { session, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ flex: 1, backgroundColor: '#F5F0E8' }}
      >
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <WaardenProvider>
      <UnsavedChangesGuardProvider>
        <OnboardingGuard />
        <AppTabs insets={insets} />
      </UnsavedChangesGuardProvider>
    </WaardenProvider>
  );
}

/**
 * Redirect new users to /onboarding before they can access tabs.
 * A user is "new" when their profile has no first_name yet.
 * Runs once on mount; after onboarding completes the profile has a name
 * so this guard never fires again.
 */
function OnboardingGuard() {
  const { data: profile, isLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !profile?.first_name) {
      router.replace('/onboarding');
    }
  }, [isLoading, profile?.first_name, router]);

  return null;
}

function AppTabs({ insets }: { insets: { bottom: number } }) {
  const { handleTabPress } = useUnsavedChangesGuard();

  const tabPressListener = ({
    navigation,
    route,
  }: {
    navigation: { navigate: (name: string) => void };
    route: { name: string };
  }) => ({
    tabPress: (event: { preventDefault: () => void }) => {
      handleTabPress(event, () => navigation.navigate(route.name));
    },
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B6D11',
        tabBarInactiveTintColor: '#888780',
        tabBarStyle: {
          backgroundColor: '#F5F0E8',
          borderTopColor: '#D3D1C7',
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        listeners={tabPressListener}
        options={{
          title: common.nav.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="modules"
        listeners={tabPressListener}
        options={{
          title: common.nav.modules,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="account/index" options={{ href: null }} />
      <Tabs.Screen name="mood/index" options={{ href: null }} />
      <Tabs.Screen name="mood/history" options={{ href: null }} />
      <Tabs.Screen name="waarden/index" options={{ href: null }} />
      <Tabs.Screen name="waarden/new" options={{ href: null }} />
      <Tabs.Screen name="waarden/[id]" options={{ href: null }} />
      <Tabs.Screen name="waarden/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="waarden/checkin" options={{ href: null }} />
    </Tabs>
  );
}
