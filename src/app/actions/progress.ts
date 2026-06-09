'use server';

import { createClient } from '@/lib/supabase/server';
import { getDefaultProgress, withModuleUpdate } from '@/lib/progress';
import type { ModuleId, UserProgress } from '@/types/content';

export async function saveModuleProgress(
  moduleId: ModuleId,
  lastStepId: string,
  completed: boolean,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Niet ingelogd');

  // Ensure profile exists — guard against users who logged in before the callback fix.
  // email is included so it's always present in the profiles table.
  await supabase
    .from('profiles')
    .upsert(
      { id: user.id, email: user.email ?? null },
      { onConflict: 'id', ignoreDuplicates: true },
    );

  const { data: existing } = await supabase
    .from('user_progress')
    .select('progress')
    .eq('user_id', user.id)
    .single();

  const current: UserProgress = (existing?.progress as UserProgress | null) ?? getDefaultProgress();

  const updated = withModuleUpdate(current, moduleId, lastStepId, completed);

  const { error } = await supabase.from('user_progress').upsert({
    user_id: user.id,
    progress: updated,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}
