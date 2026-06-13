import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { MODULE_META } from '@/lib/content';
import { isoDate } from '@/lib/mood';
import { useTodaysMood } from '@/lib/mood-queries';
import { getModuleStatus, MODULE_ORDER } from '@/lib/progress';
import { useUserProgress } from '@/lib/progress-queries';
import { needsCollectionCheckin, needsCollectionPlanSetup } from '@/lib/waarden';
import { useWaarden } from '@/providers/WaardenProvider';
import home from '@/content/nl/home.json';

interface TodoItem {
  key: string;
  label: string;
  onPress: () => void;
}

export function TodoBlock() {
  const router = useRouter();
  const { data: todaysMood, isLoading: moodLoading } = useTodaysMood();
  const { data: progress } = useUserProgress();
  const { data: waardenData, loading: waardenLoading } = useWaarden();

  if (moodLoading || waardenLoading || !progress) return null;

  const today = isoDate();
  const items: TodoItem[] = [];

  if (!todaysMood) {
    items.push({
      key: 'mood',
      label: home.todo.moodItem,
      onPress: () => router.push('/mood'),
    });
  }

  const hasWaarden = waardenData.waarden.length > 0;
  if (!hasWaarden) {
    items.push({
      key: 'waarden-new',
      label: home.todo.waardenAanmakenItem,
      onPress: () => router.push('/waarden/new'),
    });
  } else {
    if (needsCollectionPlanSetup(waardenData.acties, waardenData.barriers)) {
      items.push({
        key: 'waarden-plan',
        label: home.todo.waardenPlanItem,
        onPress: () => router.push('/waarden/plan'),
      });
    } else if (needsCollectionCheckin(waardenData.waarden, waardenData.checkins, today)) {
      items.push({
        key: 'waarden-checkin',
        label: home.todo.waardenCheckinItem,
        onPress: () => router.push('/waarden/checkin'),
      });
    }
  }

  const nextModuleId = MODULE_ORDER.find((id) => {
    const status = getModuleStatus(id, progress);
    return status === 'available' || status === 'in_progress';
  });
  if (nextModuleId) {
    const status = getModuleStatus(nextModuleId, progress);
    const title = MODULE_META[nextModuleId].title;
    const label =
      status === 'in_progress'
        ? home.todo.moduleContinueItem.replace('{title}', title)
        : home.todo.moduleStartItem.replace('{title}', title);
    const href = nextModuleId === 'onboarding' ? '/modules/onboarding' : `/modules/${nextModuleId}`;
    items.push({
      key: 'module',
      label,
      onPress: () => router.push(href as Parameters<typeof router.push>[0]),
    });
  }

  if (items.length === 0) {
    return (
      <View className="mb-4 rounded-2xl border border-primary-border-soft bg-primary-soft p-4">
        <Text className="font-semibold text-primary-dark">{home.todo.emptyTitle}</Text>
        <Text className="mt-1 text-sm text-primary">{home.todo.emptyBody}</Text>
      </View>
    );
  }

  return (
    <View className="mb-4 rounded-2xl bg-surface p-4 shadow-sm">
      <Text className="mb-1 font-semibold text-text">{home.todo.title}</Text>
      <Text className="mb-3 text-sm text-text-subtle">{home.todo.intro}</Text>
      <View className="gap-2">
        {items.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={item.onPress}
            className="flex-row items-center gap-3 rounded-xl bg-background px-3 py-2.5 active:bg-primary-soft"
          >
            <View className="h-2 w-2 rounded-full bg-primary" />
            <Text className="flex-1 text-sm text-text">{item.label}</Text>
            <Text className="text-text-muted">›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
