import { Text, View } from 'react-native';

import { CheckinAntwoordIcon } from '@/components/waarden/CheckinAntwoordIcon';
import waarden from '@/content/nl/waarden.json';
import { collectionCheckins, last7Days } from '@/lib/waarden';
import type { WaardeCheckin, WaardeCheckinAntwoord } from '@/types/waarden';

interface Props {
  checkins: WaardeCheckin[];
}

/** 7-day heatmap of collection waarden check-ins. */
export function WaardenCheckinTrend({ checkins }: Props) {
  const days = last7Days();
  const entries = collectionCheckins(checkins);
  const hasEntries = entries.length > 0;
  const periodLabel = formatTrendPeriodLabel(days);

  return (
    <View className="rounded-2xl bg-surface p-4 shadow-sm">
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-bold uppercase tracking-wide text-text-muted">
            {waarden.overview.historyTitle}
          </Text>
          <Text className="mt-1 text-sm text-text-subtle">{waarden.overview.historySubtitle}</Text>
        </View>
        <Text className="text-sm font-medium text-text-muted">{periodLabel}</Text>
      </View>

      <View className="flex-row flex-wrap gap-1.5">
        {days.map((day) => {
          const entry = entries.find((item) => item.datum === day);
          const dayNum = new Date(`${day}T12:00:00`).getDate();
          const style = heatmapStyle(entry?.antwoord);
          return (
            <View key={day} className="items-center">
              <View className={`mb-1 h-8 w-8 items-center justify-center rounded-lg ${style.bg}`}>
                <CheckinAntwoordIcon antwoord={entry?.antwoord} size={16} />
              </View>
              <Text className="text-[9px] text-text-muted">{dayNum}</Text>
            </View>
          );
        })}
      </View>

      {!hasEntries ? (
        <Text className="mt-4 text-center text-sm text-text-muted">
          {waarden.detail.historyEmpty}
        </Text>
      ) : null}
    </View>
  );
}

function heatmapStyle(antwoord: WaardeCheckinAntwoord | undefined): { bg: string } {
  if (antwoord === 'ja') return { bg: 'bg-primary-soft' };
  if (antwoord === 'neutraal') return { bg: 'bg-surface-muted' };
  if (antwoord === 'nee') return { bg: 'bg-crisis-soft' };
  return { bg: 'bg-border' };
}

function formatTrendPeriodLabel(days: string[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return '';

  const firstDate = new Date(`${first}T12:00:00`);
  const lastDate = new Date(`${last}T12:00:00`);
  const sameMonth =
    firstDate.getMonth() === lastDate.getMonth() &&
    firstDate.getFullYear() === lastDate.getFullYear();

  if (sameMonth) {
    return lastDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  }

  const firstMonth = firstDate.toLocaleDateString('nl-NL', { month: 'short' });
  const lastMonthYear = lastDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  return `${firstMonth} – ${lastMonthYear}`;
}
