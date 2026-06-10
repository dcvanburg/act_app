import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmotionTagPicker } from '@/components/mood/EmotionTagPicker';
import { MoodSelector } from '@/components/mood/MoodSelector';
import mood from '@/content/nl/mood.json';
import { useSaveMoodLog } from '@/lib/mood-queries';
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
  const insets = useSafeAreaInsets();
  const save = useSaveMoodLog();

  const [score, setScore] = useState<MoodScore | null>(null);
  const [tags, setTags] = useState<EmotionTag[]>([]);
  const [note, setNote] = useState('');

  async function handleSave() {
    if (score === null) return;
    save.mutate(
      { mood_score: score, emotion_tags: tags, note: note.trim() || null },
      {
        onSuccess: () => router.replace('/home'),
      },
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 112,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
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
            <Text className="font-serif text-xl font-bold text-text">{mood.checkIn.title}</Text>
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
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={mood.checkIn.notePlaceholder}
                  placeholderTextColor="#888780"
                  editable={!save.isPending}
                  multiline
                  numberOfLines={4}
                  className="min-h-[96px] rounded-lg border border-border bg-background px-3 py-3 text-base text-text"
                  textAlignVertical="top"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
