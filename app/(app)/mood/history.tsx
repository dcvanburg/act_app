import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoodTrendChart } from '@/components/mood/MoodTrendChart';
import mood from '@/content/nl/mood.json';
import { buildSeries, seriesAverage } from '@/lib/mood';
import { useMoodLogs } from '@/lib/mood-queries';
import type { EmotionTag, MoodLog, MoodScore } from '@/types/content';

type Range = '7d' | '30d';

const scoreMeta = mood.scores as { value: MoodScore; emoji: string; label: string }[];

/**
 * /mood/history — 7d / 30d trend + recent entries.
 *
 * Chart is hand-rolled SVG (no chart lib dep). The "average" stat is a simple
 * mean over the entries in the range; we display it alongside the emoji of
 * the rounded mood to keep the affective signal intact.
 */
export default function MoodHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>('7d');
  const { data: logs, isLoading } = useMoodLogs(range);

  const series = useMemo(() => buildSeries(logs ?? [], range === '7d' ? 7 : 30), [logs, range]);
  const average = useMemo(() => seriesAverage(series), [series]);
  const recent = useMemo(() => (logs ?? []).slice(0, 12), [logs]);

  const chartWidth = Math.min(Dimensions.get('window').width - 32, 400);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
      }}
    >
      <View className="mx-auto w-full max-w-md gap-4">
        <View className="mb-2 flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Terug"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
            className="p-1"
          >
            <Text className="text-lg text-text-muted">‹</Text>
          </Pressable>
          <Text className="font-serif text-xl font-bold text-text">{mood.history.title}</Text>
        </View>

        <View className="flex-row gap-2">
          <RangeButton
            label={mood.history.range7d}
            active={range === '7d'}
            onPress={() => setRange('7d')}
          />
          <RangeButton
            label={mood.history.range30d}
            active={range === '30d'}
            onPress={() => setRange('30d')}
          />
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#3B6D11" />
          </View>
        ) : (logs ?? []).length === 0 ? (
          <View className="rounded-2xl bg-surface p-6 shadow-sm">
            <Text className="font-serif text-lg font-semibold text-text">
              {mood.history.emptyTitle}
            </Text>
            <Text className="mt-2 text-sm text-text-subtle">{mood.history.emptyBody}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/mood')}
              className="mt-4 rounded-lg bg-primary px-4 py-3 active:bg-primary-dark"
            >
              <Text className="text-center text-sm font-semibold text-white">
                {mood.homeCard.promptAction}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="rounded-2xl bg-surface p-5 shadow-sm">
              <View className="mb-3 flex-row items-baseline justify-between">
                <Text className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {mood.history.averageLabel}
                </Text>
                <Text className="text-xs text-text-muted">
                  {(logs ?? []).length} {mood.history.entriesLabel}
                </Text>
              </View>
              <View className="flex-row items-end gap-2">
                {average !== null ? (
                  <>
                    <Text className="text-3xl">
                      {scoreMeta[Math.round(average) - 1]?.emoji ?? '·'}
                    </Text>
                    <Text className="font-serif text-2xl font-bold text-text">
                      {average.toFixed(1)}
                    </Text>
                    <Text className="text-text-muted">/ 5</Text>
                  </>
                ) : (
                  <Text className="text-base text-text-muted">—</Text>
                )}
              </View>

              <View className="mt-5">
                <MoodTrendChart series={series} width={chartWidth - 40} />
              </View>
            </View>

            <View className="rounded-2xl bg-surface shadow-sm">
              {recent.map((log: MoodLog, i: number) => {
                const meta = scoreMeta[log.mood_score - 1];
                return (
                  <View key={log.id}>
                    {i > 0 ? <View className="h-px bg-border" /> : null}
                    <View className="flex-row items-start gap-3 p-4">
                      <Text className="text-2xl">{meta?.emoji ?? '·'}</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-text">
                          {formatDate(log.date)} · {meta?.label}
                        </Text>
                        {log.emotion_tags.length > 0 ? (
                          <Text className="mt-1 text-xs text-text-muted">
                            {log.emotion_tags.map((t: EmotionTag) => labelForTag(t)).join(' · ')}
                          </Text>
                        ) : null}
                        {log.note ? (
                          <Text className="mt-2 text-sm italic text-text-subtle">
                            &ldquo;{log.note}&rdquo;
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function RangeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={
        'flex-1 rounded-full border px-4 py-2 ' +
        (active
          ? 'border-primary bg-primary-soft'
          : 'border-border bg-surface active:bg-primary-soft')
      }
    >
      <Text
        className={
          'text-center text-sm ' + (active ? 'font-semibold text-primary-dark' : 'text-text-muted')
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  });
}

const tagLabels: Record<string, string> = Object.fromEntries(mood.tags.map((t) => [t.id, t.label]));

function labelForTag(id: string): string {
  return tagLabels[id] ?? id;
}
