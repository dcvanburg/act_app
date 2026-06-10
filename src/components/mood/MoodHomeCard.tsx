import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import mood from '@/content/nl/mood.json';
import { useTodaysMood } from '@/lib/mood-queries';
import type { MoodScore } from '@/types/content';

const scoreMeta = mood.scores as { value: MoodScore; emoji: string; label: string }[];

/**
 * Home-screen mood card — surfaces today's check-in status.
 *
 * If no entry yet today: invite to /mood.
 * If entry already: show today's emoji + label, tap leads to /mood/history.
 */
export function MoodHomeCard() {
  const router = useRouter();
  const { data: today, isLoading } = useTodaysMood();

  if (isLoading) {
    // No skeleton — the home screen already has a loading state for its main
    // progress query. We just hide while pending to avoid flicker.
    return null;
  }

  if (!today) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mood.homeCard.promptTitle}
        onPress={() => router.push('/mood')}
        className="mb-4 flex-row items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft"
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
          <Text className="text-2xl">😊</Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-text">{mood.homeCard.promptTitle}</Text>
          <Text className="text-sm text-text-subtle">{mood.homeCard.promptBody}</Text>
        </View>
        <Text className="text-text-muted">›</Text>
      </Pressable>
    );
  }

  const meta = scoreMeta[today.mood_score - 1];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={mood.homeCard.doneTitle}
      onPress={() => router.push('/mood/history')}
      className="mb-4 flex-row items-center gap-4 rounded-2xl border border-primary-border-soft bg-primary-soft p-4 active:opacity-80"
    >
      <Text className="text-3xl">{meta?.emoji ?? '·'}</Text>
      <View className="flex-1">
        <Text className="font-semibold text-primary-dark">{mood.homeCard.doneTitle}</Text>
        <Text className="text-sm text-primary-dark/80">
          {meta?.label}
          {today.emotion_tags.length > 0 ? ` · ${today.emotion_tags.length} gevoel(ens)` : ''}
        </Text>
      </View>
      <Text className="text-xs text-primary">{mood.homeCard.doneAction} ›</Text>
    </Pressable>
  );
}
