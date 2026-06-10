import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import waarden from '@/content/nl/waarden.json';
import { defaultKleurForIndex } from '@/lib/waarden';
import { useWaarden } from '@/providers/WaardenProvider';
import { WAARDEN_KLEUREN } from '@/types/waarden';

export default function NewWaardeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, addWaarde } = useWaarden();

  const [naam, setNaam] = useState('');
  const [beschrijving, setBeschrijving] = useState('');
  const [kleur, setKleur] = useState(defaultKleurForIndex(data.waarden.length));

  function save() {
    if (!naam.trim()) {
      Alert.alert(waarden.new.nameRequired);
      return;
    }
    const waarde = addWaarde({ naam, beschrijving, kleur });
    router.replace(`/waarden/${waarde.id}`);
  }

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
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mb-5 flex-row items-center gap-1"
        >
          <Text className="text-base text-text-muted">‹ {waarden.detail.back}</Text>
        </Pressable>
        <Text className="mb-6 font-serif text-2xl font-bold text-text">{waarden.new.title}</Text>

        <FormGroup label={waarden.new.nameLabel}>
          <TextInput
            value={naam}
            onChangeText={setNaam}
            placeholder={waarden.new.namePlaceholder}
            className="rounded-xl border border-border bg-surface-muted px-3.5 py-3 text-base text-text"
            placeholderTextColor="#888780"
          />
          <View className="mt-2.5 flex-row flex-wrap gap-2">
            {waarden.suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                onPress={() => setNaam(suggestion)}
                className={
                  'rounded-full border px-3 py-1.5 ' +
                  (naam === suggestion
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-surface-muted')
                }
              >
                <Text
                  className={
                    'text-xs font-semibold ' +
                    (naam === suggestion ? 'text-primary-dark' : 'text-text-subtle')
                  }
                >
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormGroup>

        <FormGroup
          label={`${waarden.new.descLabel} ${waarden.new.descOptional}`}
        >
          <TextInput
            value={beschrijving}
            onChangeText={setBeschrijving}
            placeholder={waarden.new.descPlaceholder}
            multiline
            numberOfLines={3}
            className="min-h-[88px] rounded-xl border border-border bg-surface-muted px-3.5 py-3 text-base text-text"
            placeholderTextColor="#888780"
            textAlignVertical="top"
          />
        </FormGroup>

        <FormGroup label={waarden.new.colorLabel}>
          <View className="flex-row flex-wrap gap-2.5">
            {WAARDEN_KLEUREN.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => setKleur(option)}
                className="h-9 w-9 rounded-xl"
                style={{
                  backgroundColor: option,
                  borderWidth: kleur === option ? 3 : 0,
                  borderColor: option,
                  transform: [{ scale: kleur === option ? 1.12 : 1 }],
                }}
              />
            ))}
          </View>
        </FormGroup>

        <Pressable
          accessibilityRole="button"
          onPress={save}
          className="mt-2 rounded-xl bg-primary py-4 active:bg-primary-dark"
        >
          <Text className="text-center font-semibold text-white">{waarden.new.saveAction}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function FormGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mb-4 rounded-2xl bg-surface p-4 shadow-sm">
      <Text className="mb-2.5 text-xs font-bold uppercase tracking-wide text-text-muted">
        {label}
      </Text>
      {children}
    </View>
  );
}
