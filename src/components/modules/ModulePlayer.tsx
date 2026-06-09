import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import common from '@/content/nl/common.json';
import { FINAL_SCREEN_ID } from '@/lib/progress';
import { useSaveModuleProgress } from '@/lib/progress-queries';
import type { ComplaintType, ContentSection, ModuleContent } from '@/types/content';

type Screen =
  | { id: string; type: 'section'; data: ContentSection }
  | { id: 'body-exercise'; type: 'exercise' }
  | { id: typeof FINAL_SCREEN_ID; type: 'task' };

function buildScreens(content: ModuleContent): Screen[] {
  return [
    ...content.sections.map((s) => ({ id: s.id, type: 'section' as const, data: s })),
    { id: 'body-exercise' as const, type: 'exercise' as const },
    { id: FINAL_SCREEN_ID, type: 'task' as const },
  ];
}

interface Props {
  content: ModuleContent;
  initialScreenId: string | null;
  complaintTypes: ComplaintType[];
}

/**
 * ModulePlayer — paginated active flow.
 *
 * On every screen advance we save progress (best-effort; failures do not block
 * navigation). On reaching FINAL_SCREEN_ID and tapping "Afronden" we save with
 * completed=true and return to /home.
 */
export function ModulePlayer({ content, initialScreenId, complaintTypes }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screens = buildScreens(content);
  const initialIndex = initialScreenId
    ? Math.max(
        0,
        screens.findIndex((s) => s.id === initialScreenId),
      )
    : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const saveMutation = useSaveModuleProgress();

  const currentScreen = screens[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === screens.length - 1;
  const progressPct = ((currentIndex + 1) / screens.length) * 100;

  useEffect(() => {
    if (!currentScreen) return;
    // Save current position; mark completed only when we land on the last screen
    saveMutation.mutate({
      moduleId: content.id,
      lastStepId: currentScreen.id,
      completed: isLast,
    });
    // We intentionally do not include saveMutation in deps — it is a stable
    // hook reference, and adding it triggers a save loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, content.id, isLast]);

  function goNext() {
    if (isLast) {
      router.replace('/home');
      return;
    }
    setCurrentIndex((i) => i + 1);
  }

  function goBack() {
    if (isFirst) {
      router.back();
      return;
    }
    setCurrentIndex((i) => i - 1);
  }

  if (!currentScreen) return null;

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="border-b border-border bg-surface/80 px-4 pb-3"
      >
        <View className="mx-auto w-full max-w-md flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sluiten"
            onPress={() => router.replace('/home')}
            className="p-1.5"
          >
            <Text className="text-lg text-text-muted">{'✕'}</Text>
          </Pressable>
          <View className="flex-1">
            <Text className="text-xs font-medium text-text-muted">{content.phase}</Text>
            <Text className="text-sm font-semibold text-text" numberOfLines={1}>
              {content.title}
            </Text>
          </View>
          <Text className="text-xs text-text-muted">
            {currentIndex + 1} / {screens.length}
          </Text>
        </View>
        <View className="mx-auto mt-2 w-full max-w-md">
          <View className="h-1 overflow-hidden rounded-full bg-border">
            <View className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <View className="mx-auto w-full max-w-md">
          <ScreenContent screen={currentScreen} content={content} complaintTypes={complaintTypes} />
        </View>
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-surface/95 px-4 pt-4"
      >
        <View className="mx-auto w-full max-w-md flex-row gap-3">
          {!isFirst && (
            <Pressable
              accessibilityRole="button"
              onPress={goBack}
              className="flex-1 rounded-xl border border-border py-3"
            >
              <Text className="text-center text-sm font-medium text-text">
                {common.actions.back}
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={goNext}
            className="flex-1 rounded-xl bg-primary py-3 active:bg-primary-dark"
          >
            <Text className="text-center text-sm font-semibold text-white">
              {isLast ? common.actions.complete : common.actions.continue}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ScreenContent({
  screen,
  content,
  complaintTypes,
}: {
  screen: Screen;
  content: ModuleContent;
  complaintTypes: ComplaintType[];
}) {
  if (screen.type === 'section') {
    const section = screen.data;
    const primaryComplaint = complaintTypes[0];
    const example = section.examples
      ? ((primaryComplaint && section.examples[primaryComplaint]) ?? null)
      : null;

    return (
      <View>
        <Text className="mb-4 font-serif text-xl font-bold text-text">{section.title}</Text>
        {'body' in section && section.body ? (
          <Text className="mb-4 text-base leading-relaxed text-text-subtle">{section.body}</Text>
        ) : null}
        {'points' in section && section.points ? (
          <View className="gap-2">
            {section.points.map((point, i) => (
              <View key={i} className="flex-row gap-3">
                <View className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <Text className="flex-1 text-base text-text-subtle">{point}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {example ? (
          <View className="mt-6 rounded-xl border-l-4 border-primary bg-primary-soft p-4">
            <Text className="mb-1 text-sm font-medium text-primary">Herkenbaar voor jou</Text>
            <Text className="text-sm text-text-subtle">{example}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (screen.type === 'exercise') {
    const ex = content.bodyExercise;
    return (
      <View>
        <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
          {content.bodyWork}
        </Text>
        <Text className="mb-3 font-serif text-xl font-bold text-text">{ex.title}</Text>
        <Text className="mb-6 text-base text-text-subtle">{ex.description}</Text>
        <View className="rounded-2xl bg-surface p-5 shadow-sm">
          <Text className="text-base leading-relaxed text-text-subtle">{ex.transcript}</Text>
        </View>
      </View>
    );
  }

  const task = content.practicalTask;
  return (
    <View>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
        Praktische opdracht
      </Text>
      <Text className="mb-3 font-serif text-xl font-bold text-text">{task.title}</Text>
      <Text className="text-base leading-relaxed text-text-subtle">{task.body}</Text>
    </View>
  );
}
