import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/AppTextInput';
import { KeyboardAwareScrollScreen } from '@/components/KeyboardAwareScrollScreen';
import waarden from '@/content/nl/waarden.json';
import { useDebouncedSave } from '@/lib/use-debounced-save';
import { useWaarden } from '@/providers/WaardenProvider';

export default function WaardeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, updateWaardeBeschrijving } = useWaarden();

  const waarde = data.waarden.find((item) => item.id === id);
  const [notitie, setNotitie] = useState(waarde?.beschrijving ?? '');

  useEffect(() => {
    if (!waarde) return;
    setNotitie(waarde.beschrijving);
  }, [waarde]);

  const saveNotitie = useCallback(
    (value: string) => {
      if (!waarde) return;
      updateWaardeBeschrijving(waarde.id, value);
    },
    [waarde, updateWaardeBeschrijving],
  );

  useDebouncedSave(notitie, saveNotitie, {
    enabled: Boolean(waarde),
    baseline: waarde?.beschrijving ?? '',
  });

  if (!id || !waarde) {
    return <Redirect href="/waarden" />;
  }

  return (
    <KeyboardAwareScrollScreen
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
      }}
    >
      <View className="mx-auto w-full max-w-md">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mb-5 flex-row items-center gap-1"
        >
          <Text className="text-base text-text-muted">‹ {waarden.detail.back}</Text>
        </Pressable>

        <View className="mb-6 flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${waarde.kleur}22` }}
          >
            <View className="h-5 w-5 rounded-md" style={{ backgroundColor: waarde.kleur }} />
          </View>
          <Text className="flex-1 font-serif text-2xl font-bold text-text">{waarde.naam}</Text>
        </View>

        <View className="mb-4 rounded-2xl bg-surface p-4 shadow-sm">
          <Text className="mb-1 text-xs font-bold uppercase tracking-wide text-text-muted">
            {waarden.detail.noteHeading}
          </Text>
          <Text className="mb-3 text-sm text-text-subtle">{waarden.detail.noteIntro}</Text>
          <AppTextInput
            value={notitie}
            onChangeText={setNotitie}
            placeholder={waarden.detail.notePlaceholder}
            multiline
            numberOfLines={6}
            className="rounded-xl bg-surface-muted px-3.5"
            style={{ minHeight: 140, textAlignVertical: 'top' }}
          />
          <Text className="mt-2 text-xs text-text-muted">{waarden.detail.noteAutoSaveHint}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/waarden/edit/[id]', params: { id: waarde.id } })
          }
          className="rounded-2xl border border-border bg-surface px-4 py-3.5 active:bg-primary-soft"
        >
          <Text className="text-center text-sm font-semibold text-text">
            {waarden.detail.editAction}
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollScreen>
  );
}
