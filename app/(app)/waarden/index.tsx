import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { StarIcon } from '@/components/icons/StarIcon';
import { WaardenCheckinTrend } from '@/components/waarden/WaardenCheckinTrend';
import waarden from '@/content/nl/waarden.json';
import { isoDate } from '@/lib/mood';
import {
  buildCollectionPlanSetupItems,
  getCollectionPlanSetupGaps,
  hasCollectionCheckinToday,
  needsCollectionPlanSetup,
} from '@/lib/waarden';
import { useWaarden } from '@/providers/WaardenProvider';
import type { Waarde } from '@/types/waarden';

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
  const checkedInToday = hasCollectionCheckinToday(data.checkins, today);
  const needsPlanSetup = needsCollectionPlanSetup(data.acties, data.barriers);
  const planSetupItems = needsPlanSetup
    ? buildCollectionPlanSetupItems(
        getCollectionPlanSetupGaps(data.acties, data.barriers),
        {
          kort: waarden.detail.shortTerm,
          middel: waarden.detail.mediumTerm,
          lang: waarden.detail.longTerm,
        },
        {
          action: waarden.collection.setupMissingAction,
          barriers: waarden.collection.setupMissingBarriers,
        },
      )
    : [];

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
        <View className="mb-2 flex-row items-center gap-2">
          <BackButton onPress={() => router.back()} />
          <Text className="flex-1 font-serif text-2xl font-bold text-text">{waarden.title}</Text>
        </View>

        <View className="gap-4 pt-4">
          {data.waarden.length > 0 && needsPlanSetup ? (
            <View className="flex-row items-center justify-between rounded-2xl border border-primary-border-soft bg-primary-soft p-4">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-primary-dark">
                  {waarden.collection.setupBannerTitle}
                </Text>
                <Text className="mt-1 text-xs text-primary">
                  {waarden.collection.setupBannerIntro}
                </Text>
                {planSetupItems.map((item) => (
                  <Text key={item} className="mt-0.5 text-xs text-primary">
                    • {item}
                  </Text>
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/waarden/plan')}
                className="rounded-xl bg-primary px-4 py-2.5 active:bg-primary-dark"
              >
                <Text className="text-xs font-semibold text-white">
                  {waarden.collection.setupBannerAction}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {data.waarden.length > 0 ? (
            checkedInToday ? (
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
                  <Text className="mt-1 text-xs text-primary">{waarden.checkin.bannerSub}</Text>
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

          {data.waarden.length > 0 && !needsPlanSetup ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/waarden/plan')}
              className="rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft"
            >
              <Text className="font-semibold text-text">{waarden.collection.openPlan}</Text>
              <Text className="mt-1 text-sm text-text-subtle">
                {waarden.collection.openPlanBody}
              </Text>
            </Pressable>
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
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/waarden/new')}
                className="rounded-xl bg-primary px-5 py-3 active:bg-primary-dark"
              >
                <Text className="font-semibold text-white">{waarden.empty.action}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <WaardenCheckinTrend checkins={data.checkins} />

              <WaardenCollectionBubble waarden={data.waarden} />

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/waarden/new')}
                className="rounded-2xl border-2 border-dashed border-border py-4 active:bg-surface-muted"
              >
                <Text className="text-center font-semibold text-text">+ {waarden.addAction}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function WaardenCollectionBubble({ waarden: items }: { waarden: Waarde[] }) {
  return (
    <View className="rounded-2xl border border-primary-border-soft bg-primary-soft p-4">
      <Text className="mb-1 text-xs font-bold uppercase tracking-wide text-primary-dark">
        {waarden.collection.valuesHeading}
      </Text>
      <Text className="mb-3 text-sm text-primary">{waarden.collection.openPlanBody}</Text>

      <View className="overflow-hidden rounded-xl border border-primary-border-soft bg-surface">
        {items.map((waarde, index) => (
          <View key={waarde.id}>
            <WaardeRow waarde={waarde} grouped />
            {index < items.length - 1 ? <View className="mx-4 h-px bg-border" /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function WaardeRow({ waarde, grouped = false }: { waarde: Waarde; grouped?: boolean }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/waarden/[id]', params: { id: waarde.id } })}
      className={
        grouped
          ? 'flex-row items-center gap-3 px-4 py-3.5 active:bg-primary-soft'
          : 'flex-row items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft'
      }
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${waarde.kleur}22` }}
      >
        <View className="h-3.5 w-3.5 rounded-md" style={{ backgroundColor: waarde.kleur }} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-semibold text-text">{waarde.naam}</Text>
        {waarde.beschrijving ? (
          <Text className="mt-0.5 text-sm text-text-subtle" numberOfLines={2}>
            {waarde.beschrijving}
          </Text>
        ) : (
          <Text className="mt-0.5 text-sm text-text-muted">{waarden.detail.noteIntro}</Text>
        )}
      </View>
      <Text className="text-text-muted">›</Text>
    </Pressable>
  );
}
