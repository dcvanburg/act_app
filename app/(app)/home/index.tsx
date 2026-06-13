import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/AppLogo';
import { ChatHomeCard } from '@/components/chat/ChatHomeCard';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { TodoBlock } from '@/components/home/TodoBlock';
import { AccountIcon } from '@/components/icons/AccountIcon';
import { MoodHomeCard } from '@/components/mood/MoodHomeCard';
import { ProgramHomeCard } from '@/components/modules/ProgramHomeCard';
import { WaardenHomeCard } from '@/components/waarden/WaardenHomeCard';
import common from '@/content/nl/common.json';
import { useUserProgress } from '@/lib/progress-queries';

const CHATBOT_ENABLED = (process.env.EXPO_PUBLIC_ENABLE_CHATBOT ?? 'true') !== 'false';

/**
 * /home — program overview.
 *
 * Loads UserProgress from Supabase via TanStack Query and renders the 8-module
 * mood check-in card and a link to the Modules tab for the full program.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: progress, isLoading } = useUserProgress();
  return (
    <ScrollView
      className="flex-1 bg-background"
      style={{ flex: 1, backgroundColor: '#F5F0E8' }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 112, // room for Noodknop
        paddingHorizontal: 16,
      }}
    >
      <View className="mx-auto w-full max-w-md">
        <View className="mb-8">
          <View className="mb-2 flex-row items-center justify-between">
            <View className="w-12" />
            <AppLogo size={40} />
            <Link href="/account" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Mijn account"
                className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft active:opacity-80"
              >
                <AccountIcon size={30} />
              </Pressable>
            </Link>
          </View>
          <Text className="text-center font-serif text-2xl font-bold text-text">
            {common.app.name}
          </Text>
          <Text className="mt-1 text-center text-sm text-text-subtle">{common.app.tagline}</Text>
        </View>

        <FeatureErrorBoundary>
          <TodoBlock />
        </FeatureErrorBoundary>
        <FeatureErrorBoundary>
          <MoodHomeCard />
        </FeatureErrorBoundary>
        <FeatureErrorBoundary>
          <WaardenHomeCard />
        </FeatureErrorBoundary>

        {isLoading || !progress ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#3B6D11" />
          </View>
        ) : (
          <ProgramHomeCard progress={progress} />
        )}
        {CHATBOT_ENABLED ? (
          <FeatureErrorBoundary>
            <ChatHomeCard />
          </FeatureErrorBoundary>
        ) : null}
      </View>
    </ScrollView>
  );
}
