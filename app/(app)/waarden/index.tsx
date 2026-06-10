import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlameIcon } from '@/components/icons/FlameIcon';
import { StarIcon } from '@/components/icons/StarIcon';
import { CheckinAntwoordIcon } from '@/components/waarden/CheckinAntwoordIcon';
import waarden from '@/content/nl/waarden.json';
import { isoDate } from '@/lib/mood';
import {
  computeWaardenStreak,
  pendingCheckinWaarden,
  todayCheckinByWaarde,
  todayCheckinCount,
} from '@/lib/waarden';
import { useWaarden } from '@/providers/WaardenProvider';
import type { Waarde, WaardeCheckin, WaardeCheckinAntwoord } from '@/types/waarden';

export default function WaardenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, loading } = useWaarden();

  if (loading) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 112,
          paddingHorizontal: 16,
        }}
      >
        <View className="mx-auto w-full max-w-md items-center py-12">
          <ActivityIndicator color="#3B6D11" />
        </View>
      </ScrollView>
    );
  }

  const today = isoDate();
  const streak = computeWaardenStreak(data.checkins, today);
  const vandaagByWaarde = todayCheckinByWaarde(data.checkins, today);
  const doneToday = todayCheckinCount(data.checkins, today);
  const pending = pendingCheckinWaarden(data.waarden, data.checkins, today);
  const allDone = data.waarden.length > 0 && pending.length === 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
      }}
    >
      <View className="mx-auto w-full max-w-md">
        <View className="mb-2 flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Terug"
            onPress={() => router.back()}
            className="p-1"
          >
            <Text className="text-lg text-text-muted">‹</Text>
          </Pressable>
          <Text className="flex-1 font-serif text-2xl font-bold text-text">{waarden.title}</Text>
        </View>

        <View className="gap-4 pt-4">
          {streak > 0 ? (
            <View className="flex-row items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: '#FFF3D6' }}
              >
                <FlameIcon size={22} color="#E8A800" />
              </View>
              <Text className="font-semibold text-text">
                {streak} {waarden.streak.label}
              </Text>
            </View>
          ) : null}

          {data.waarden.length > 0 ? (
            allDone ? (
              <View className="rounded-2xl border border-primary-border-soft bg-primary-soft p-4">
                <Text className="text-sm font-bold text-primary-dark">
                  {waarden.checkin.doneTitle}
                </Text>
                <Text className="mt-1 text-xs text-primary">{waarden.checkin.doneBody}</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-between rounded-2xl border border-primary-border-soft bg-primary-soft p-4">
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-bold text-primary-dark">
                    {waarden.checkin.bannerTitle}
                  </Text>
                  <Text className="mt-1 text-xs text-primary">
                    {waarden.checkin.bannerSub
                      .replace('{done}', String(doneToday))
                      .replace('{total}', String(data.waarden.length))}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/waarden/checkin')}
                  className="rounded-xl bg-primary px-4 py-2.5 active:bg-primary-dark"
                >
                  <Text className="text-xs font-semibold text-white">
                    {waarden.checkin.bannerAction}
                  </Text>
                </Pressable>
              </View>
            )
          ) : null}

          {data.waarden.length === 0 ? (
            <View className="items-center rounded-2xl bg-surface px-6 py-12 shadow-sm">
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
                <StarIcon size={30} color="#3B6D11" />
              </View>
              <Text className="mb-2 font-serif text-lg font-semibold text-text">
                {waarden.empty.title}
              </Text>
              <Text className="mb-6 text-center text-sm leading-5 text-text-subtle">
                {waarden.empty.body}
              </Text>
              <Link href="/waarden/new" asChild>
                <Pressable className="rounded-xl bg-primary px-5 py-3 active:bg-primary-dark">
                  <Text className="font-semibold text-white">+ {waarden.empty.action}</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <>
              {data.waarden.map((waarde) => (
                <WaardeRow
                  key={waarde.id}
                  waarde={waarde}
                  checkin={vandaagByWaarde.get(waarde.id) ?? null}
                />
              ))}
              <Link href="/waarden/new" asChild>
                <Pressable className="rounded-2xl border-2 border-dashed border-border py-4 active:bg-surface-muted">
                  <Text className="text-center font-semibold text-text">+ {waarden.addAction}</Text>
                </Pressable>
              </Link>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function WaardeRow({ waarde, checkin }: { waarde: Waarde; checkin: WaardeCheckin | null }) {
  const checkedIn = checkin !== null;

  return (
    <Link href={{ pathname: '/waarden/[id]', params: { id: waarde.id } }} asChild>
      <Pressable className="flex-row items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${waarde.kleur}22` }}
        >
          <View className="h-4 w-4 rounded-md" style={{ backgroundColor: waarde.kleur }} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-semibold text-text">{waarde.naam}</Text>
          {waarde.beschrijving ? (
            <Text className="text-sm text-text-subtle" numberOfLines={1}>
              {waarde.beschrijving}
            </Text>
          ) : null}
        </View>
        {checkedIn ? (
          <View className="flex-row items-center gap-1.5">
            <CheckinAntwoordIcon antwoord={checkin.antwoord} size={16} />
            <Text className="text-xs text-text-subtle">{antwoordLabel(checkin.antwoord)}</Text>
          </View>
        ) : (
          <Text className="text-xs text-text-muted">{waarden.homeCard.pendingLabel}</Text>
        )}
        <Text className="text-text-muted">›</Text>
      </Pressable>
    </Link>
  );
}

function antwoordLabel(antwoord: WaardeCheckinAntwoord): string {
  if (antwoord === 'ja') return waarden.checkin.yesLabel;
  if (antwoord === 'neutraal') return waarden.checkin.neutralLabel;
  return waarden.checkin.noLabel;
}
