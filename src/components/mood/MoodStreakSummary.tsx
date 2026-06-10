import { ActivityIndicator, Text, View } from 'react-native';

import mood from '@/content/nl/mood.json';
import type { CheckInStreak } from '@/lib/mood';

interface Props {
  streak: CheckInStreak | undefined;
  isLoading?: boolean;
}

/** Compact streak stats: consecutive days + total check-in days. */
export function MoodStreakSummary({ streak, isLoading }: Props) {
  if (isLoading) {
    return (
      <View className="mb-4 items-center rounded-2xl bg-surface py-6 shadow-sm">
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  if (!streak || streak.totalDays === 0) {
    return null;
  }

  return (
    <View className="mb-4 rounded-2xl bg-surface p-4 shadow-sm">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {mood.streak.title}
      </Text>
      <View className="flex-row gap-3">
        <StreakStat value={streak.current} label={mood.streak.currentLabel} highlight />
        <StreakStat value={streak.totalDays} label={mood.streak.totalLabel} />
      </View>
    </View>
  );
}

function StreakStat({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View
      className={
        'flex-1 items-center rounded-xl px-3 py-4 ' +
        (highlight ? 'bg-primary-soft' : 'bg-surface-muted')
      }
    >
      <Text
        className={
          'font-serif text-3xl font-bold ' + (highlight ? 'text-primary-dark' : 'text-text')
        }
      >
        {value}
      </Text>
      <Text
        className={
          'mt-1 text-center text-xs ' + (highlight ? 'text-primary-dark' : 'text-text-muted')
        }
      >
        {label}
      </Text>
    </View>
  );
}
