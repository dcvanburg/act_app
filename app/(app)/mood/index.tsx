import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmotionTagPicker } from '@/components/mood/EmotionTagPicker';
import { MoodSelector } from '@/components/mood/MoodSelector';
import { BackButton } from '@/components/BackButton';
import { AppTextInput } from '@/components/AppTextInput';
import { KeyboardAwareScrollScreen } from '@/components/KeyboardAwareScrollScreen';
import mood from '@/content/nl/mood.json';
import { useSaveMoodLog } from '@/lib/mood-queries';
import { useOnboardingIdleReset } from '@/lib/use-onboarding-idle-reset';
import { defaultTabBarStyle, hiddenTabBarStyle } from '@/lib/tab-bar';
import type { EmotionTag, MoodScore } from '@/types/content';

/**
 * /mood — daily mood check-in.
 *
 * Three-section single screen: score → tags → optional note → Save. Errors
 * surface inline; success replaces the form with a Saved confirmation that
 * routes back to /home (the user's just-saved entry is then visible on the
 * home card via useTodaysMood).
 */
export default function MoodCheckinScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const save = useSaveMoodLog();
  const { from, reset } = useLocalSearchParams<{ from?: string; reset?: string }>();
  const inOnboarding = from === 'onboarding';

  const [showIntro, setShowIntro] = useState(inOnboarding);
  const [score, setScore] = useState<MoodScore | null>(null);
  const [tags, setTags] = useState<EmotionTag[]>([]);
  const [note, setNote] = useState('');

  const resetMoodState = useCallback(() => {
    setShowIntro(inOnboarding);
    setScore(null);
    setTags([]);
    setNote('');
  }, [inOnboarding]);

  useOnboardingIdleReset(reset, resetMoodState);

  useEffect(() => {
    if (!inOnboarding) return;
    navigation.setOptions({ tabBarStyle: hiddenTabBarStyle });
    return () => navigation.setOptions({ tabBarStyle: defaultTabBarStyle(insets.bottom) });
  }, [inOnboarding, navigation, insets.bottom]);

  const nextRoute = inOnboarding ? '/modules/onboarding?from=onboarding' : '/home';

  async function handleSave() {
    if (score === null) return;
    save.mutate(
      { mood_score: score, emotion_tags: tags, note: note.trim() || null },
      { onSuccess: () => router.replace(nextRoute) },
    );
  }

  return (
    <>
      <Modal
        visible={showIntro}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIntro(false)}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <View className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-lg">
            <Text className="mb-1 font-serif text-xl font-bold text-text">
              {mood.onboardingIntro.title}
            </Text>
            <Text className="mb-5 text-sm leading-relaxed text-text-subtle">
              {mood.onboardingIntro.intro}
            </Text>

            <View className="mb-3 rounded-xl bg-primary-soft p-4">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {mood.onboardingIntro.step1Label}
              </Text>
              <Text className="mb-1 font-semibold text-text">
                {mood.onboardingIntro.step1Title}
              </Text>
              <Text className="text-sm leading-snug text-text-subtle">
                {mood.onboardingIntro.step1Body}
              </Text>
            </View>

            <View className="mb-6 rounded-xl border border-border bg-surface-muted p-4">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {mood.onboardingIntro.step2Label}
              </Text>
              <Text className="mb-1 font-semibold text-text">
                {mood.onboardingIntro.step2Title}
              </Text>
              <Text className="text-sm leading-snug text-text-subtle">
                {mood.onboardingIntro.step2Body}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setShowIntro(false)}
              className="rounded-lg bg-primary px-4 py-3 active:bg-primary-dark"
            >
              <Text className="text-center text-base font-semibold text-white">
                {mood.onboardingIntro.closeButton}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <KeyboardAwareScrollScreen
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 112,
          paddingHorizontal: 16,
        }}
      >
        <View className="mx-auto w-full max-w-md">
          <View className="mb-2 flex-row items-center gap-3">
            {!inOnboarding && <BackButton onPress={() => router.back()} />}
            <Text className="flex-1 font-serif text-xl font-bold text-text">
              {mood.checkIn.title}
            </Text>
            {inOnboarding && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/modules/onboarding?from=onboarding')}
              >
                <Text className="text-sm text-text-muted">Overslaan</Text>
              </Pressable>
            )}
          </View>
          <Text className="mb-6 text-sm text-text-subtle">{mood.checkIn.subtitle}</Text>

          <View className="mb-6 rounded-2xl bg-surface p-5 shadow-sm">
            <MoodSelector value={score} onChange={setScore} disabled={save.isPending} />
          </View>

          {score !== null ? (
            <>
              <View className="mb-6 rounded-2xl bg-surface p-5 shadow-sm">
                <Text className="mb-1 font-semibold text-text">{mood.checkIn.tagsHeading}</Text>
                <Text className="mb-4 text-xs text-text-muted">{mood.checkIn.skipTagsHint}</Text>
                <EmotionTagPicker value={tags} onChange={setTags} disabled={save.isPending} />
              </View>

              <View className="mb-6 rounded-2xl bg-surface p-5 shadow-sm">
                <Text className="mb-3 font-semibold text-text">{mood.checkIn.noteHeading}</Text>
                <AppTextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={mood.checkIn.notePlaceholder}
                  editable={!save.isPending}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {save.isError ? (
                <Text className="mb-3 text-sm text-crisis">{mood.checkIn.errorMessage}</Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleSave}
                disabled={save.isPending}
                className="rounded-lg bg-primary px-4 py-3 active:bg-primary-dark disabled:opacity-60"
              >
                {save.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center text-base font-semibold text-white">
                    {mood.checkIn.saveAction}
                  </Text>
                )}
              </Pressable>
            </>
          ) : null}
        </View>
      </KeyboardAwareScrollScreen>
    </>
  );
}
