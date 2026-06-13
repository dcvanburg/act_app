import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/AppTextInput';
import { KeyboardAwareScrollScreen } from '@/components/KeyboardAwareScrollScreen';
import waarden from '@/content/nl/waarden.json';
import { defaultKleurForIndex } from '@/lib/waarden';
import { useWaarden } from '@/providers/WaardenProvider';

export default function NewWaardeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, addWaarden } = useWaarden();

  const existingNames = useMemo(
    () => new Set(data.waarden.map((w) => w.naam.trim().toLowerCase())),
    [data.waarden],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const isFirstSetup = data.waarden.length === 0;

  function toggleSuggestion(name: string) {
    const key = name.trim();
    if (!key || existingNames.has(key.toLowerCase())) return;
    setSelected((prev) => {
      if (prev.includes(key)) {
        setNotes((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  }

  function addCustom() {
    const key = customName.trim();
    if (!key) return;
    if (existingNames.has(key.toLowerCase()) || selected.includes(key)) {
      setCustomName('');
      return;
    }
    setSelected((prev) => [...prev, key]);
    setCustomName('');
  }

  function updateNote(name: string, value: string) {
    setNotes((prev) => ({ ...prev, [name]: value }));
  }

  function save() {
    if (selected.length === 0) {
      Alert.alert(waarden.select.minRequired);
      return;
    }

    addWaarden(
      selected.map((naam, index) => ({
        naam,
        beschrijving: notes[naam]?.trim() ?? '',
        kleur: defaultKleurForIndex(data.waarden.length + index),
      })),
    );

    if (isFirstSetup) {
      router.replace('/waarden/plan');
      return;
    }
    router.replace('/waarden');
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

        <Text className="mb-2 font-serif text-2xl font-bold text-text">
          {isFirstSetup ? waarden.select.title : waarden.new.title}
        </Text>
        <Text className="mb-6 text-sm leading-5 text-text-subtle">
          {isFirstSetup ? waarden.select.subtitle : waarden.select.addMoreSubtitle}
        </Text>

        <View className="mb-4 rounded-2xl bg-surface p-4 shadow-sm">
          <Text className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
            {waarden.select.suggestionsHeading}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {waarden.suggestions.map((suggestion) => {
              const taken = existingNames.has(suggestion.toLowerCase());
              const active = selected.includes(suggestion);
              return (
                <Pressable
                  key={suggestion}
                  accessibilityRole="button"
                  disabled={taken}
                  onPress={() => toggleSuggestion(suggestion)}
                  className={
                    'rounded-full border px-3 py-1.5 ' +
                    (taken
                      ? 'border-border bg-surface-muted opacity-50'
                      : active
                        ? 'border-primary bg-primary-soft'
                        : 'border-border bg-surface-muted')
                  }
                >
                  <Text
                    className={
                      'text-xs font-semibold ' +
                      (active ? 'text-primary-dark' : 'text-text-subtle')
                    }
                  >
                    {suggestion}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mb-6 rounded-2xl bg-surface p-4 shadow-sm">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
            {waarden.select.customHeading}
          </Text>
          <View className="flex-row gap-2">
            <AppTextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder={waarden.new.namePlaceholder}
              onSubmitEditing={addCustom}
              returnKeyType="done"
              className="flex-1 rounded-xl bg-surface-muted px-3.5"
            />
            <Pressable
              accessibilityRole="button"
              onPress={addCustom}
              className="items-center justify-center rounded-xl bg-primary px-3.5 active:bg-primary-dark"
            >
              <Text className="text-xl text-white">+</Text>
            </Pressable>
          </View>
        </View>

        {selected.length > 0 ? (
          <View className="mb-4 rounded-2xl border border-primary-border-soft bg-primary-soft p-4">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-dark">
              {waarden.select.selectedHeading}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {selected.map((name) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  onPress={() => toggleSuggestion(name)}
                  className="rounded-full border border-primary bg-surface px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-primary-dark">{name} ×</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {selected.length > 0 ? (
          <View className="mb-4 gap-3">
            <View>
              <Text className="text-xs font-bold uppercase tracking-wide text-text-muted">
                {waarden.select.notesHeading}
              </Text>
              <Text className="mt-1 text-sm text-text-subtle">{waarden.select.notesIntro}</Text>
            </View>
            {selected.map((name) => (
              <View key={name} className="rounded-2xl bg-surface p-4 shadow-sm">
                <Text className="mb-2 font-semibold text-text">{name}</Text>
                <AppTextInput
                  value={notes[name] ?? ''}
                  onChangeText={(value) => updateNote(name, value)}
                  placeholder={waarden.detail.notePlaceholder}
                  multiline
                  numberOfLines={4}
                  className="rounded-xl bg-surface-muted px-3.5"
                  style={{ minHeight: 96, textAlignVertical: 'top' }}
                />
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={save}
          className="rounded-xl bg-primary py-4 active:bg-primary-dark"
        >
          <Text className="text-center font-semibold text-white">
            {isFirstSetup ? waarden.select.saveAction : waarden.select.addAction}
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollScreen>
  );
}
