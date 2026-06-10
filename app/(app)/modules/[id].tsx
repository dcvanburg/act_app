import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { ModulePlayer } from '@/components/modules/ModulePlayer';
import { ModuleReadOnlyView } from '@/components/modules/ModuleReadOnlyView';
import { getModuleContent } from '@/lib/content';
import { getModuleStatus, isAccessible, MODULE_ORDER } from '@/lib/progress';
import { useUserProgress } from '@/lib/progress-queries';
import type { ModuleId, ModuleProgress } from '@/types/content';

/**
 * /modules/[id] — module screen for modules 1–7.
 *
 * Onboarding (module 0) has its own route at /onboarding.
 *
 * Locked module → redirect home.
 * Completed module → ModuleReadOnlyView (single scrollable page).
 * Available / in-progress → ModulePlayer (paginated).
 */
export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: progress, isLoading } = useUserProgress();

  if (!id || !MODULE_ORDER.includes(id as ModuleId) || id === 'onboarding') {
    return <Redirect href="/home" />;
  }
  const moduleId = id as ModuleId;

  if (isLoading || !progress) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  if (!isAccessible(moduleId, progress)) {
    return <Redirect href="/home" />;
  }

  const content = getModuleContent(moduleId);
  const status = getModuleStatus(moduleId, progress);
  const lastStepId =
    progress.modules.find((m: ModuleProgress) => m.moduleId === moduleId)?.lastStepId ?? null;

  if (status === 'completed') {
    return <ModuleReadOnlyView content={content} complaintTypes={progress.intake.complaintTypes} />;
  }

  return (
    <ModulePlayer
      content={content}
      initialScreenId={lastStepId}
      complaintTypes={progress.intake.complaintTypes}
    />
  );
}
