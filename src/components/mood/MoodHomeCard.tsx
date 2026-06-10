import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { FlameIcon } from '@/components/icons/FlameIcon';
import mood from '@/content/nl/mood.json';
import { useCheckInStreak, useTodaysMood } from '@/lib/mood-queries';
import type { MoodScore } from '@/types/content';

import { MoodFace } from './MoodFace';

const scoreMeta = mood.scores as { value: MoodScore; label: string }[];

function MoodStreakLine({ current }: { current: number }) {
  if (current <= 0) return null;

  return (
    <View className="mt-1.5 flex-row items-center gap-1.5">
      <FlameIcon size={14} color="#E8A800" />
      <Text className="text-xs font-medium text-text-subtle">
        {current} {mood.streak.label}
      </Text>
    </View>
  );
}

/**
 * Home-screen mood card — surfaces today's check-in status.
 *
 * If no entry yet today: invite to /mood.
 * If entry already: show today's face + label, tap leads to /mood/history.
 */
export function MoodHomeCard() {
  const router = useRouter();
  const { data: today, isLoading } = useTodaysMood();
  const { data: streak } = useCheckInStreak();

  if (isLoading) {
    return null;
  }

  const streakCurrent = streak?.current ?? 0;

  if (!today) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mood.homeCard.promptTitle}
        onPress={() => router.push('/mood')}
        className="mb-4 flex-row items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft"
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
          <MoodFace score={4} size={32} color="#3B6D11" background="#D4E8C0" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-text">{mood.homeCard.promptTitle}</Text>
          <Text className="text-sm text-text-subtle">{mood.homeCard.promptBody}</Text>
          <MoodStreakLine current={streakCurrent} />
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
      <MoodFace score={today.mood_score} size={40} color="#2D5210" background="#D4E8C0" />
      <View className="flex-1">
        <Text className="font-semibold text-primary-dark">{mood.homeCard.doneTitle}</Text>
        <Text className="text-sm text-primary-dark/80">
          {meta?.label}
          {today.emotion_tags.length > 0 ? ` · ${today.emotion_tags.length} gevoel(ens)` : ''}
        </Text>
        <MoodStreakLine current={streakCurrent} />
      </View>
      <Text className="text-xs text-primary">{mood.homeCard.doneAction} ›</Text>
    </Pressable>
  );
}
