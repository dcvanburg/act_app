import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDefaultProgress, getModuleStatus } from '@/lib/progress';
import { getModuleContent } from '@/lib/content';
import { ModulePlayer } from '@/components/modules/ModulePlayer';
import { ModuleReadOnlyView } from '@/components/modules/ModuleReadOnlyView';
import type { UserProgress } from '@/types/content';

export const metadata: Metadata = {
  title: 'Welkom & Intake',
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: row } = await supabase
    .from('user_progress')
    .select('progress')
    .eq('user_id', user.id)
    .single();

  const progress: UserProgress = (row?.progress as UserProgress | null) ?? getDefaultProgress();
  const content = getModuleContent('onboarding');
  const status = getModuleStatus('onboarding', progress);

  // Onboarding is always accessible — status check is a safeguard
  if (status === 'locked') notFound();

  const lastStepId = progress.modules.find(m => m.moduleId === 'onboarding')?.lastStepId ?? null;

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
