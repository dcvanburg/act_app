import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/AppLogo';
import { PhaseProgressSummary } from '@/components/modules/PhaseProgressSummary';
import { ProgramOverview } from '@/components/modules/ProgramOverview';
import common from '@/content/nl/common.json';
import { getPhaseProgress } from '@/lib/progress';
import { useUserProgress } from '@/lib/progress-queries';

/**
 * /modules — program hub with phase progression + all 8 modules grouped by phase.
 */
export default function ModulesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: progress, isLoading } = useUserProgress();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
      }}
    >
      <View className="mx-auto w-full max-w-md">
        <View className="mb-6">
          <AppLogo size={32} />
          <View className="mt-2 flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Terug"
              onPress={() => router.back()}
              className="p-1"
            >
              <Text className="text-lg text-text-muted">‹</Text>
            </Pressable>
            <Text className="flex-1 font-serif text-2xl font-bold text-text">
              {common.nav.modules}
            </Text>
          </View>
        </View>

        {isLoading || !progress ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#3B6D11" />
          </View>
        ) : (
          <>
            <PhaseProgressSummary phases={getPhaseProgress(progress)} />
            <ProgramOverview progress={progress} groupByPhase />
          </>
        )}
      </View>
    </ScrollView>
  );
}
