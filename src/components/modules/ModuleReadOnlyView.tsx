import { Link, useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MODULE_META } from '@/lib/content';
import { getModuleStatus, MODULE_ORDER } from '@/lib/progress';
import { useUserProgress } from '@/lib/progress-queries';
import type { ComplaintType, ModuleContent } from '@/types/content';

interface Props {
  content: ModuleContent;
  complaintTypes: ComplaintType[];
}

/**
 * ModuleReadOnlyView — completed-module revisit.
 *
 * Single scrollable page (no pagination, no progress saving). Per
 * docs/NAVIGATION.md: a completed module stays completed and is browsable
 * in full at any time.
 */
export function ModuleReadOnlyView({ content, complaintTypes }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const primaryComplaint = complaintTypes[0] ?? null;
  const { data: progress } = useUserProgress();

  const currentIndex = MODULE_ORDER.indexOf(content.id);
  const nextModuleId =
    currentIndex >= 0 && currentIndex < MODULE_ORDER.length - 1
      ? MODULE_ORDER[currentIndex + 1]
      : null;
  const nextAccessible =
    nextModuleId && progress
      ? getModuleStatus(nextModuleId, progress) !== 'locked'
      : false;
  const nextMeta = nextModuleId ? MODULE_META[nextModuleId] : null;
  const nextHref: Href | null = nextModuleId
    ? nextModuleId === 'onboarding'
      ? '/modules/onboarding'
      : { pathname: '/modules/[id]', params: { id: nextModuleId } }
    : null;

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="border-b border-border bg-surface/80 px-4 pb-3"
      >
        <View className="mx-auto w-full max-w-md flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Terug naar overzicht"
            onPress={() => router.back()}
            className="p-1.5"
          >
            <Text className="text-lg text-text-muted">{'‹'}</Text>
          </Pressable>
          <View className="flex-1">
            <Text className="text-xs font-medium text-text-muted">{content.phase} · Afgerond</Text>
            <Text className="text-sm font-semibold text-text" numberOfLines={1}>
              {content.title}
            </Text>
          </View>
          <View className="rounded-full bg-primary-soft px-2 py-1">
            <Text className="text-xs font-medium text-primary">✓ Afgerond</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 96,
          gap: 24,
        }}
      >
        <View className="mx-auto w-full max-w-md gap-6">
          {content.sections.map((section) => {
            const example = section.examples
              ? ((primaryComplaint && section.examples[primaryComplaint]) ?? null)
              : null;
            return (
              <View key={section.id}>
                <Text className="mb-3 font-serif text-lg font-bold text-text">{section.title}</Text>
                {'body' in section && section.body ? (
                  <Text className="text-base leading-relaxed text-text-subtle">{section.body}</Text>
                ) : null}
                {'points' in section && section.points ? (
                  <View className="mt-2 gap-2">
                    {section.points.map((point, i) => (
                      <View key={i} className="flex-row gap-3">
                        <View className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        <Text className="flex-1 text-base text-text-subtle">{point}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {example ? (
                  <View className="mt-4 rounded-xl border-l-4 border-primary bg-primary-soft p-4">
                    <Text className="mb-1 text-sm font-medium text-primary">
                      Herkenbaar voor jou
                    </Text>
                    <Text className="text-sm text-text-subtle">{example}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}

          <View>
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {content.bodyWork}
            </Text>
            <Text className="mb-2 font-serif text-lg font-bold text-text">
              {content.bodyExercise.title}
            </Text>
            <Text className="mb-4 text-base text-text-subtle">
              {content.bodyExercise.description}
            </Text>
            <View className="rounded-2xl bg-surface p-5 shadow-sm">
              <Text className="text-base leading-relaxed text-text-subtle">
                {content.bodyExercise.transcript}
              </Text>
            </View>
          </View>

          <View>
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Praktische opdracht
            </Text>
            <Text className="mb-2 font-serif text-lg font-bold text-text">
              {content.practicalTask.title}
            </Text>
            <Text className="text-base leading-relaxed text-text-subtle">
              {content.practicalTask.body}
            </Text>
          </View>

          {content.backReferences.length > 0 ? (
            <View>
              <Text className="mb-3 text-sm font-semibold text-text-muted">Eerdere modules</Text>
              <View className="gap-2">
                {content.backReferences.map((ref) => (
                  <Link
                    key={ref.moduleId}
                    href={{ pathname: '/modules/[id]', params: { id: ref.moduleId } }}
                    asChild
                  >
                    <Pressable className="rounded-xl bg-surface p-3 shadow-sm active:bg-primary-soft">
                      <Text className="text-sm text-text">← {ref.label}</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          ) : null}

          {nextModuleId && nextAccessible && nextMeta && nextHref ? (
            <View>
              <Text className="mb-3 text-sm font-semibold text-text-muted">Volgende module</Text>
              <Link href={nextHref} asChild>
                <Pressable className="flex-row items-center justify-between rounded-xl bg-surface p-3 shadow-sm active:bg-primary-soft">
                  <Text className="text-sm text-text">Doorgaan naar: {nextMeta.title}</Text>
                  <Text className="text-text-muted">›</Text>
                </Pressable>
              </Link>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
