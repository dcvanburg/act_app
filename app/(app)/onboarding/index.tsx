import { ActivityIndicator, View } from 'react-native';

import { ModulePlayer } from '@/components/modules/ModulePlayer';
import { ModuleReadOnlyView } from '@/components/modules/ModuleReadOnlyView';
import { getModuleContent } from '@/lib/content';
import { getModuleStatus } from '@/lib/progress';
import { useUserProgress } from '@/lib/progress-queries';
import type { ModuleProgress } from '@/types/content';

/**
 * /onboarding — module 0 (welcome + intake).
 *
 * α4 routes module 0 through the same Player/ReadOnly views as the other
 * modules. The richer intake flow (complaint-type selection + safety screening)
 * lands in α5 and replaces this minimal pass.
 */
export default function OnboardingScreen() {
  const { data: progress, isLoading } = useUserProgress();

  if (isLoading || !progress) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  const content = getModuleContent('onboarding');
  const status = getModuleStatus('onboarding', progress);
  const lastStepId =
    progress.modules.find((m: ModuleProgress) => m.moduleId === 'onboarding')?.lastStepId ?? null;

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
