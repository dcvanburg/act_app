import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { getDefaultProgress, withModuleUpdate } from '@/lib/progress';
import { useAuth } from '@/providers/AuthProvider';
import type { ModuleId, UserProgress } from '@/types/content';

const PROGRESS_KEY = (userId: string | undefined) => ['user_progress', userId];

/**
 * useUserProgress — load the user_progress row for the signed-in user.
 *
 * Always returns a UserProgress: when no row exists yet (new user) we return
 * the default shape. The query is disabled until the auth session has a user.
 */
export function useUserProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: PROGRESS_KEY(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<UserProgress> => {
      if (!user) return getDefaultProgress();
      const { data, error } = await supabase
        .from('user_progress')
        .select('progress')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.progress as UserProgress | null) ?? getDefaultProgress();
    },
  });
}

interface SaveArgs {
  moduleId: ModuleId;
  lastStepId: string;
  completed: boolean;
}

/**
 * useSaveModuleProgress — write a screen advance / module completion.
 *
 * Best-effort: errors are surfaced but the local cache is updated optimistically
 * so the UI stays responsive. The pre-pivot Next.js behaviour was identical —
 * save failures do not block navigation.
 */
export function useSaveModuleProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, lastStepId, completed }: SaveArgs) => {
      if (!user) throw new Error('Niet ingelogd');

      // Profile row must exist before user_progress.user_id FK is satisfied.
      // ignoreDuplicates keeps it a true upsert (never overwrites name/phone
      // captured in α5 onboarding once that lands).
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
        .maybeSingle();

      const current =
        (existing?.progress as UserProgress | null) ??
        queryClient.getQueryData<UserProgress>(PROGRESS_KEY(user.id)) ??
        getDefaultProgress();

      const updated = withModuleUpdate(current, moduleId, lastStepId, completed);

      const { error } = await supabase.from('user_progress').upsert({
        user_id: user.id,
        progress: updated,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(PROGRESS_KEY(user?.id), updated);
    },
  });
}
