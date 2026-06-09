import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDefaultProgress, getModuleStatus, isAccessible } from '@/lib/progress';
import { getModuleContent, MODULE_META } from '@/lib/content';
import { ModulePlayer } from '@/components/modules/ModulePlayer';
import { ModuleReadOnlyView } from '@/components/modules/ModuleReadOnlyView';
import type { ModuleId, UserProgress } from '@/types/content';
import { MODULE_ORDER } from '@/lib/progress';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const meta = MODULE_META[id as ModuleId];
  return { title: meta?.title ?? 'Module' };
}

export async function generateStaticParams() {
  // Exclude onboarding — it has its own route
  return MODULE_ORDER.filter((id) => id !== 'onboarding').map((id) => ({ id }));
}

export default async function ModulePage({ params }: Props) {
  const { id } = await params;

  // Validate the id param
  const moduleId = id as ModuleId;
  if (!MODULE_ORDER.includes(moduleId) || moduleId === 'onboarding') {
    notFound();
  }

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

  // Enforce unlock — locked modules redirect home
  if (!isAccessible(moduleId, progress)) {
    redirect('/home');
  }

  const content = getModuleContent(moduleId);
  const status = getModuleStatus(moduleId, progress);
  const lastStepId = progress.modules.find((m) => m.moduleId === moduleId)?.lastStepId ?? null;

  // Completed: read-only scrollable view
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
