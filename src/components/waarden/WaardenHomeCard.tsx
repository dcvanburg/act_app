import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { FlameIcon } from '@/components/icons/FlameIcon';
import { StarIcon } from '@/components/icons/StarIcon';
import waarden from '@/content/nl/waarden.json';
import { isoDate } from '@/lib/mood';
import { computeWaardenStreak, todayCheckinCount } from '@/lib/waarden';
import { useWaarden } from '@/providers/WaardenProvider';

/** Home-screen card: check-in progress only (scores live on /waarden). */
export function WaardenHomeCard() {
  const router = useRouter();
  const { data, loading } = useWaarden();

  if (loading) {
    return (
      <View className="mb-4 items-center rounded-2xl bg-surface py-8 shadow-sm">
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  const today = isoDate();
  const total = data.waarden.length;
  const doneToday = todayCheckinCount(data.checkins, today);
  const streak = computeWaardenStreak(data.checkins, today);
  const pending = total - doneToday;
  const allDone = total > 0 && pending === 0;

  const statusText =
    total === 0
      ? waarden.homeCard.body
      : allDone
        ? waarden.homeCard.bodyAllDone
        : waarden.homeCard.pendingRemaining.replace('{pending}', String(pending));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={waarden.homeCard.openLabel}
      onPress={() => router.push('/waarden')}
      className={
        'mb-4 flex-row items-center gap-4 rounded-2xl p-4 shadow-sm active:opacity-90 ' +
        (allDone
          ? 'border border-primary-border-soft bg-primary-soft'
          : 'bg-surface')
      }
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
        <StarIcon size={26} color={allDone ? '#27500A' : '#3B6D11'} />
      </View>
      <View className="flex-1">
        <Text
          className={
            'font-semibold ' + (allDone ? 'text-primary-dark' : 'text-text')
          }
        >
          {waarden.homeCard.title}
        </Text>
        <Text
          className={
            'text-sm ' + (allDone ? 'text-primary' : 'text-text-subtle')
          }
        >
          {statusText}
        </Text>
        {streak > 0 ? (
          <View className="mt-1.5 flex-row items-center gap-1.5">
            <FlameIcon size={14} color="#E8A800" />
            <Text className="text-xs font-medium text-text-subtle">
              {streak} {waarden.streak.label}
            </Text>
          </View>
        ) : null}
      </View>
      <Text className={allDone ? 'text-primary' : 'text-text-muted'}>›</Text>
    </Pressable>
  );
}
