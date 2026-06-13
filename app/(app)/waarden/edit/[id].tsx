import {
  Redirect,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/AppTextInput';
import { KeyboardAwareScrollScreen } from '@/components/KeyboardAwareScrollScreen';
import waarden from '@/content/nl/waarden.json';
import { useRegisterUnsavedChangesGuard } from '@/providers/UnsavedChangesGuardProvider';
import { useWaarden } from '@/providers/WaardenProvider';
import { WAARDEN_KLEUREN } from '@/types/waarden';

export default function WaardeEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const allowLeaveRef = useRef(false);
  const { data, updateWaarde, deleteWaarde } = useWaarden();

  const waarde = data.waarden.find((item) => item.id === id);
  const waardeId = waarde?.id;

  const [naam, setNaam] = useState(waarde?.naam ?? '');
  const [kleur, setKleur] = useState(waarde?.kleur ?? WAARDEN_KLEUREN[0]);

  useEffect(() => {
    if (!waarde) return;
    setNaam(waarde.naam);
    setKleur(waarde.kleur);
  }, [waarde]);

  const hasUnsavedChanges = useMemo(() => {
    if (!waarde) return false;
    return naam !== waarde.naam || kleur !== waarde.kleur;
  }, [waarde, naam, kleur]);

  useFocusEffect(
    useCallback(() => {
      allowLeaveRef.current = false;
    }, []),
  );

  const confirmLeave = useCallback(
    (onLeave: () => void) => {
      if (!hasUnsavedChanges || allowLeaveRef.current) {
        onLeave();
        return;
      }

      Alert.alert(waarden.edit.unsavedTitle, waarden.edit.unsavedBody, [
        { text: waarden.edit.unsavedStay, style: 'cancel' },
        {
          text: waarden.edit.unsavedLeave,
          style: 'destructive',
          onPress: () => {
            allowLeaveRef.current = true;
            onLeave();
          },
        },
      ]);
    },
    [hasUnsavedChanges],
  );

  useRegisterUnsavedChangesGuard(hasUnsavedChanges, confirmLeave, allowLeaveRef);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeaveRef.current || !hasUnsavedChanges) return;

      event.preventDefault();
      Alert.alert(waarden.edit.unsavedTitle, waarden.edit.unsavedBody, [
        { text: waarden.edit.unsavedStay, style: 'cancel' },
        {
          text: waarden.edit.unsavedLeave,
          style: 'destructive',
          onPress: () => {
            allowLeaveRef.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  function save() {
    if (!waardeId) return;
    if (!naam.trim()) {
      Alert.alert(waarden.edit.nameRequired);
      return;
    }

    updateWaarde(waardeId, { naam, beschrijving: waarde.beschrijving, kleur });
    allowLeaveRef.current = true;
    router.back();
  }

  function confirmDelete() {
    if (!waardeId) return;
    Alert.alert(waarden.detail.deleteConfirmTitle, waarden.detail.deleteConfirmBody, [
      { text: waarden.detail.deleteCancel, style: 'cancel' },
      {
        text: waarden.detail.deleteConfirmAction,
        style: 'destructive',
        onPress: () => {
          allowLeaveRef.current = true;
          deleteWaarde(waardeId);
          router.replace('/waarden');
        },
      },
    ]);
  }

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
          onPress={() => confirmLeave(() => router.back())}
          className="mb-5 flex-row items-center gap-1"
        >
          <Text className="text-base text-text-muted">‹ {waarden.detail.back}</Text>
        </Pressable>

        <Text className="mb-6 font-serif text-2xl font-bold text-text">{waarden.edit.title}</Text>

        <FormGroup label={waarden.new.nameLabel}>
          <AppTextInput
            value={naam}
            onChangeText={setNaam}
            placeholder={waarden.new.namePlaceholder}
            className="rounded-xl bg-surface-muted px-3.5"
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
          className="mb-4 rounded-xl bg-primary py-4 active:bg-primary-dark"
        >
          <Text className="text-center font-semibold text-white">{waarden.edit.saveAction}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={confirmDelete}
          className="rounded-xl border border-crisis py-3.5 active:bg-crisis-soft"
        >
          <Text className="text-center text-sm font-medium text-crisis">
            {waarden.detail.deleteAction}
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollScreen>
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
