import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
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
        <View className="mb-6 flex-row items-center gap-2">
          <BackButton onPress={() => router.navigate('/home')} />
          <Text className="flex-1 font-serif text-2xl font-bold text-text">
            {common.nav.modules}
          </Text>
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
