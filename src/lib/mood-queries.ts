import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { daysAgo, isoDate } from '@/lib/mood';
import { useAuth } from '@/providers/AuthProvider';
import type { EmotionTag, MoodLog, MoodScore } from '@/types/content';

type MoodRange = '7d' | '30d';

const RANGE_DAYS: Record<MoodRange, number> = { '7d': 7, '30d': 30 };

const MOOD_LOGS_KEY = (userId: string | undefined, range: MoodRange) => [
  'mood_logs',
  userId,
  range,
];
const TODAY_KEY = (userId: string | undefined) => ['mood_logs', userId, 'today'];

/**
 * useMoodLogs — load all mood entries in the requested window for the signed-in
 * user, newest-created first. Stored in `mood_logs` (γ-1 migration).
 */
export function useMoodLogs(range: MoodRange) {
  const { user } = useAuth();

  return useQuery({
    queryKey: MOOD_LOGS_KEY(user?.id, range),
    enabled: !!user,
    queryFn: async (): Promise<MoodLog[]> => {
      if (!user) return [];
      const from = daysAgo(RANGE_DAYS[range] - 1);
      const { data, error } = await supabase
        .from('mood_logs')
        .select('id, user_id, date, mood_score, emotion_tags, note, created_at')
        .eq('user_id', user.id)
        .gte('date', from)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MoodLog[];
    },
  });
}

/**
 * useTodaysMood — last mood entry the user logged today, or null if they
 * haven't checked in yet. Used by /home for the "Hoe voel je je vandaag?" card.
 */
export function useTodaysMood() {
  const { user } = useAuth();

  return useQuery({
    queryKey: TODAY_KEY(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<MoodLog | null> => {
      if (!user) return null;
      const today = isoDate();
      const { data, error } = await supabase
        .from('mood_logs')
        .select('id, user_id, date, mood_score, emotion_tags, note, created_at')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<MoodLog>();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export interface SaveMoodLogArgs {
  mood_score: MoodScore;
  emotion_tags: EmotionTag[];
  note: string | null;
}

/**
 * useSaveMoodLog — append a new mood entry for today.
 *
 * Mood logs are append-only: re-checking-in later in the day creates a NEW
 * row rather than updating the morning one. lastPerDay() decides which one is
 * the "day's representation" at read time. This preserves the lived record
 * without smearing two distinct emotional moments together.
 */
export function useSaveMoodLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: SaveMoodLogArgs): Promise<MoodLog> => {
      if (!user) throw new Error('Niet ingelogd');

      // Make sure the profiles row exists for the FK.
      await supabase
        .from('profiles')
        .upsert(
          { id: user.id, email: user.email ?? null },
          { onConflict: 'id', ignoreDuplicates: true },
        );

      const payload = {
        user_id: user.id,
        date: isoDate(),
        mood_score: args.mood_score,
        emotion_tags: args.emotion_tags,
        note: args.note?.trim() ? args.note.trim() : null,
      };

      const { data, error } = await supabase
        .from('mood_logs')
        .insert(payload)
        .select('id, user_id, date, mood_score, emotion_tags, note, created_at')
        .single<MoodLog>();

      if (error) throw error;
      if (!data) throw new Error('Insert returned no row');
      return data;
    },
    onSuccess: () => {
      // Invalidate everything mood-related — the caches use different ranges
      // so a manual setQueryData would have to touch all of them.
      queryClient.invalidateQueries({ queryKey: ['mood_logs', user?.id] });
    },
  });
}
