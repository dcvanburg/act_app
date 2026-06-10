import { Redirect, useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { useRegisterUnsavedChangesGuard } from '@/providers/UnsavedChangesGuardProvider';
import { useWaarden } from '@/providers/WaardenProvider';
import type { BarriereType, WaardeBarriere, WaardeTermijn } from '@/types/waarden';
import { WAARDEN_KLEUREN } from '@/types/waarden';

const BARRIER_TYPES: BarriereType[] = ['vermijding', 'gedachte', 'zelfkritiek', 'eigen'];
const TERMIJNEN: WaardeTermijn[] = ['kort', 'middel', 'lang'];

const termijnLabels: Record<WaardeTermijn, { title: string; sub: string }> = {
  kort: { title: waarden.detail.shortTerm, sub: waarden.detail.shortTermSub },
  middel: { title: waarden.detail.mediumTerm, sub: waarden.detail.mediumTermSub },
  lang: { title: waarden.detail.longTerm, sub: waarden.detail.longTermSub },
};

export default function WaardeEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const allowLeaveRef = useRef(false);
  const {
    data,
    updateWaarde,
    updateActie,
    deleteActie,
    updateBarriere,
    deleteBarriere,
    deleteWaarde,
  } = useWaarden();

  const waarde = data.waarden.find((item) => item.id === id);
  const waardeId = waarde?.id;

  const [naam, setNaam] = useState(waarde?.naam ?? '');
  const [beschrijving, setBeschrijving] = useState(waarde?.beschrijving ?? '');
  const [kleur, setKleur] = useState(waarde?.kleur ?? WAARDEN_KLEUREN[0]);

  const waardeActies = useMemo(
    () => data.acties.filter((item) => item.waarde_id === waardeId),
    [data.acties, waardeId],
  );

  const waardeBarriers = useMemo(
    () => data.barriers.filter((item) => item.waarde_id === waardeId),
    [data.barriers, waardeId],
  );

  const [actieDrafts, setActieDrafts] = useState<Record<string, { actie: string; termijn: WaardeTermijn }>>({});
  const [barrierDrafts, setBarrierDrafts] = useState<
    Record<string, { type: BarriereType; omschrijving: string; eigenLabel: string }>
  >({});

  useEffect(() => {
    if (!waarde) return;
    setNaam(waarde.naam);
    setBeschrijving(waarde.beschrijving);
    setKleur(waarde.kleur);
  }, [waarde]);

  useEffect(() => {
    const nextActies: Record<string, { actie: string; termijn: WaardeTermijn }> = {};
    for (const item of waardeActies) {
      nextActies[item.id] = { actie: item.actie, termijn: item.termijn };
    }
    setActieDrafts(nextActies);
  }, [waardeActies]);

  useEffect(() => {
    const nextBarriers: Record<string, { type: BarriereType; omschrijving: string; eigenLabel: string }> =
      {};
    for (const item of waardeBarriers) {
      nextBarriers[item.id] = {
        type: item.type,
        omschrijving: item.omschrijving,
        eigenLabel: item.eigenLabel ?? '',
      };
    }
    setBarrierDrafts(nextBarriers);
  }, [waardeBarriers]);

  const hasUnsavedChanges = useMemo(() => {
    if (!waarde) return false;

    if (naam !== waarde.naam || beschrijving !== waarde.beschrijving || kleur !== waarde.kleur) {
      return true;
    }

    for (const item of waardeActies) {
      const draft = actieDrafts[item.id];
      if (!draft) continue;
      if (draft.actie !== item.actie || draft.termijn !== item.termijn) return true;
    }

    for (const item of waardeBarriers) {
      const draft = barrierDrafts[item.id];
      if (!draft) continue;
      const savedEigenLabel = item.eigenLabel ?? '';
      if (
        draft.type !== item.type ||
        draft.omschrijving !== item.omschrijving ||
        (draft.type === 'eigen' && draft.eigenLabel !== savedEigenLabel)
      ) {
        return true;
      }
    }

    return false;
  }, [
    waarde,
    naam,
    beschrijving,
    kleur,
    waardeActies,
    waardeBarriers,
    actieDrafts,
    barrierDrafts,
  ]);

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

    updateWaarde(waardeId, { naam, beschrijving, kleur });

    for (const item of waardeActies) {
      const draft = actieDrafts[item.id];
      if (!draft?.actie.trim()) continue;
      updateActie({
        ...item,
        actie: draft.actie,
        termijn: draft.termijn,
      });
    }

    for (const item of waardeBarriers) {
      const draft = barrierDrafts[item.id];
      if (!draft?.omschrijving.trim()) continue;
      if (draft.type === 'eigen' && !draft.eigenLabel.trim()) continue;
      const updated: WaardeBarriere = {
        ...item,
        type: draft.type,
        omschrijving: draft.omschrijving,
        aangemaakt_op: item.aangemaakt_op,
        ...(draft.type === 'eigen' ? { eigenLabel: draft.eigenLabel.trim() } : {}),
      };
      updateBarriere(updated);
    }

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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
      }}
      keyboardShouldPersistTaps="handled"
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
          <TextInput
            value={naam}
            onChangeText={setNaam}
            placeholder={waarden.new.namePlaceholder}
            className="rounded-xl border border-border bg-surface-muted px-3.5 py-3 text-base text-text"
            placeholderTextColor="#888780"
          />
        </FormGroup>

        <FormGroup label={`${waarden.new.descLabel} ${waarden.new.descOptional}`}>
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

        <FormGroup label={waarden.edit.planHeading}>
          {waardeActies.length === 0 ? (
            <Text className="text-sm text-text-muted">{waarden.edit.planEmpty}</Text>
          ) : (
            waardeActies.map((item) => {
              const draft = actieDrafts[item.id];
              if (!draft) return null;
              return (
                <View key={item.id} className="mb-3 rounded-xl bg-surface-muted p-3">
                  <View className="mb-2 flex-row flex-wrap gap-1.5">
                    {TERMIJNEN.map((termijn) => (
                      <Pressable
                        key={termijn}
                        accessibilityRole="button"
                        onPress={() =>
                          setActieDrafts((prev) => ({
                            ...prev,
                            [item.id]: { ...draft, termijn },
                          }))
                        }
                        className={
                          'rounded-full border px-2.5 py-1 ' +
                          (draft.termijn === termijn
                            ? 'border-primary bg-primary-soft'
                            : 'border-border bg-surface')
                        }
                      >
                        <Text
                          className={
                            'text-[10px] font-semibold ' +
                            (draft.termijn === termijn ? 'text-primary-dark' : 'text-text-muted')
                          }
                        >
                          {termijnLabels[termijn].sub}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    value={draft.actie}
                    onChangeText={(text) =>
                      setActieDrafts((prev) => ({
                        ...prev,
                        [item.id]: { ...draft, actie: text },
                      }))
                    }
                    className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
                    placeholderTextColor="#888780"
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => deleteActie(item.id)}
                    className="mt-2 self-end"
                  >
                    <Text className="text-xs text-crisis">{waarden.detail.deleteConfirmAction}</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </FormGroup>

        <FormGroup label={waarden.edit.barriersHeading}>
          {waardeBarriers.length === 0 ? (
            <Text className="text-sm text-text-muted">{waarden.edit.barriersEmpty}</Text>
          ) : (
            waardeBarriers.map((item) => {
              const draft = barrierDrafts[item.id];
              if (!draft) return null;
              return (
                <View key={item.id} className="mb-3 rounded-xl bg-surface-muted p-3">
                  <View className="mb-2 flex-row flex-wrap gap-1.5">
                    {BARRIER_TYPES.map((barrierType) => (
                      <Pressable
                        key={barrierType}
                        accessibilityRole="button"
                        onPress={() =>
                          setBarrierDrafts((prev) => ({
                            ...prev,
                            [item.id]: { ...draft, type: barrierType },
                          }))
                        }
                        className={
                          'rounded-full border px-2.5 py-1 ' +
                          (draft.type === barrierType
                            ? 'border-primary bg-primary-soft'
                            : 'border-border bg-surface')
                        }
                      >
                        <Text
                          className={
                            'text-[10px] font-semibold ' +
                            (draft.type === barrierType ? 'text-primary-dark' : 'text-text-muted')
                          }
                        >
                          {waarden.barrierTypes[barrierType]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {draft.type === 'eigen' ? (
                    <TextInput
                      value={draft.eigenLabel}
                      onChangeText={(text) =>
                        setBarrierDrafts((prev) => ({
                          ...prev,
                          [item.id]: { ...draft, eigenLabel: text },
                        }))
                      }
                      placeholder={waarden.detail.customBarrierPlaceholder}
                      className="mb-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
                      placeholderTextColor="#888780"
                    />
                  ) : null}
                  <TextInput
                    value={draft.omschrijving}
                    onChangeText={(text) =>
                      setBarrierDrafts((prev) => ({
                        ...prev,
                        [item.id]: { ...draft, omschrijving: text },
                      }))
                    }
                    placeholder={waarden.detail.barrierPlaceholder}
                    multiline
                    numberOfLines={2}
                    className="min-h-[72px] rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
                    placeholderTextColor="#888780"
                    textAlignVertical="top"
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => deleteBarriere(item.id)}
                    className="mt-2 self-end"
                  >
                    <Text className="text-xs text-crisis">{waarden.detail.deleteConfirmAction}</Text>
                  </Pressable>
                </View>
              );
            })
          )}
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
