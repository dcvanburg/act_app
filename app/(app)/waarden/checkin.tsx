import { Redirect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/AppTextInput';
import { KeyboardAwareScrollScreen } from '@/components/KeyboardAwareScrollScreen';
import { BackButton } from '@/components/BackButton';
import { CheckboxIcon } from '@/components/icons/CheckboxIcon';
import { CrossIcon } from '@/components/icons/CrossIcon';
import { NeutralIcon } from '@/components/icons/NeutralIcon';
import { WaardenCheckinSummaryCard } from '@/components/waarden/WaardenCheckinSummary';
import waarden from '@/content/nl/waarden.json';
import { isoDate } from '@/lib/mood';
import {
  buildCheckinSummary,
  needsCollectionCheckin,
  pendingCollectionActieReviews,
} from '@/lib/waarden';
import { useWaarden } from '@/providers/WaardenProvider';
import type { WaardeActie, WaardeCheckinAntwoord } from '@/types/waarden';

type CheckinPhase = 'deadline' | 'summary' | 'main';

const termijnLabels = waarden.checkin.termijnLabels;
const barrierTypeLabels = waarden.barrierTypes;

export default function WaardenCheckinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, addCheckin, reviewActie } = useWaarden();
  const today = isoDate();

  const needsCheckin = needsCollectionCheckin(data.waarden, data.checkins, today);

  const [phase, setPhase] = useState<CheckinPhase>('main');
  const [deadlineIndex, setDeadlineIndex] = useState(0);
  const [keuze, setKeuze] = useState<WaardeCheckinAntwoord | null>(null);
  const [notitie, setNotitie] = useState('');
  const [behaald, setBehaald] = useState<boolean | null>(null);
  const [deadlineBeschrijving, setDeadlineBeschrijving] = useState('');
  const [wantsNewAction, setWantsNewAction] = useState<boolean | null>(null);
  const [nieuweActie, setNieuweActie] = useState('');

  const deadlineQueue = useMemo(
    () => pendingCollectionActieReviews(data.acties, today),
    [data.acties, today],
  );

  const planSummary = useMemo(
    () =>
      buildCheckinSummary(
        data.acties,
        data.barriers,
        today,
        waarden.checkin.reminderTemplates,
        termijnLabels,
        barrierTypeLabels,
      ),
    [data.acties, data.barriers, today],
  );

  const currentDeadline = deadlineQueue[deadlineIndex];

  function resetMainForm() {
    setKeuze(null);
    setNotitie('');
  }

  function resetDeadlineForm() {
    setBehaald(null);
    setDeadlineBeschrijving('');
    setWantsNewAction(null);
    setNieuweActie('');
  }

  function resolveInitialPhase(due: WaardeActie[], hasSummary: boolean): CheckinPhase {
    if (due.length > 0) return 'deadline';
    if (hasSummary) return 'summary';
    return 'main';
  }

  useFocusEffect(
    useCallback(() => {
      resetMainForm();
      resetDeadlineForm();
      setDeadlineIndex(0);
      setPhase(resolveInitialPhase(deadlineQueue, planSummary !== null));
    }, [deadlineQueue, planSummary]),
  );

  function advanceAfterDeadline() {
    resetDeadlineForm();
    if (deadlineIndex + 1 < deadlineQueue.length) {
      setDeadlineIndex((value) => value + 1);
      return;
    }
    setPhase(planSummary ? 'summary' : 'main');
  }

  function submitDeadlineReview() {
    if (!currentDeadline || behaald === null) return;
    if (wantsNewAction === true && !nieuweActie.trim()) return;

    reviewActie(currentDeadline.id, {
      behaald,
      beschrijving: deadlineBeschrijving,
      nieuweActie: wantsNewAction === true ? nieuweActie : undefined,
    });
    advanceAfterDeadline();
  }

  function submitMain() {
    if (keuze === null) return;
    addCheckin({
      datum: today,
      antwoord: keuze,
      notitie,
    });
    router.replace('/waarden');
  }

  if (!needsCheckin) {
    return <Redirect href="/waarden" />;
  }

  const notePlaceholder =
    keuze === 'ja'
      ? waarden.checkin.noteYesPlaceholder
      : keuze === 'neutraal'
        ? waarden.checkin.noteNeutralPlaceholder
        : waarden.checkin.noteNoPlaceholder;

  const deadlineCanContinue =
    behaald !== null &&
    (wantsNewAction === false || (wantsNewAction === true && nieuweActie.trim().length > 0));

  const termijnLabel = currentDeadline
    ? termijnLabels[currentDeadline.termijn]
    : termijnLabels.kort;

  return (
    <KeyboardAwareScrollScreen
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
        flexGrow: 1,
      }}
    >
      <View className="mx-auto w-full max-w-md">
        <View className="mb-4 flex-row items-center gap-1">
          <BackButton onPress={() => router.back()} />
          <Text className="text-sm text-text-muted">{waarden.detail.back}</Text>
        </View>

        <View className="rounded-2xl bg-surface p-5 shadow-sm">
          <View className="mb-4 flex-row flex-wrap gap-2">
            {data.waarden.map((waarde) => (
              <View
                key={waarde.id}
                className="flex-row items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1.5"
              >
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: waarde.kleur }} />
                <Text className="text-sm font-medium text-text">{waarde.naam}</Text>
              </View>
            ))}
          </View>

          {phase === 'deadline' && currentDeadline ? (
            <View>
              <Text className="mb-1 font-serif text-xl font-bold text-text">
                {waarden.checkin.deadlineTitle}
              </Text>
              <Text className="mb-4 text-sm text-text-subtle">{waarden.checkin.deadlineIntro}</Text>

              <View className="mb-4 rounded-xl border border-primary-border-soft bg-primary-soft px-4 py-3">
                <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {termijnLabel}
                </Text>
                <Text className="text-sm font-medium leading-5 text-primary-dark">
                  {currentDeadline.actie}
                </Text>
              </View>

              <Text className="mb-3 font-semibold text-text">
                {waarden.checkin.deadlineQuestion}
              </Text>
              <View className="mb-4 flex-row gap-2">
                <BinaryChoiceButton
                  selected={behaald === true}
                  label={waarden.checkin.deadlineYes}
                  tone="positive"
                  onPress={() => setBehaald(true)}
                />
                <BinaryChoiceButton
                  selected={behaald === false}
                  label={waarden.checkin.deadlineNo}
                  tone="negative"
                  onPress={() => setBehaald(false)}
                />
              </View>

              {behaald !== null ? (
                <View>
                  <Text className="mb-2 text-sm font-medium text-text">
                    {waarden.checkin.deadlineDescriptionLabel}
                  </Text>
                  <AppTextInput
                    value={deadlineBeschrijving}
                    onChangeText={setDeadlineBeschrijving}
                    placeholder={waarden.checkin.deadlineDescriptionPlaceholder}
                    multiline
                    numberOfLines={3}
                    className="mb-4 rounded-xl bg-surface-muted px-3.5"
                    style={{ minHeight: 88 }}
                  />

                  <Text className="mb-3 font-semibold text-text">
                    {waarden.checkin.deadlineNewActionQuestion}
                  </Text>
                  <View className="mb-4 flex-row gap-2">
                    <BinaryChoiceButton
                      selected={wantsNewAction === true}
                      label={waarden.checkin.deadlineNewActionYes}
                      tone="positive"
                      onPress={() => setWantsNewAction(true)}
                    />
                    <BinaryChoiceButton
                      selected={wantsNewAction === false}
                      label={waarden.checkin.deadlineNewActionNo}
                      tone="neutral"
                      onPress={() => {
                        setWantsNewAction(false);
                        setNieuweActie('');
                      }}
                    />
                  </View>

                  {wantsNewAction === true ? (
                    <AppTextInput
                      value={nieuweActie}
                      onChangeText={setNieuweActie}
                      placeholder={waarden.checkin.deadlineNewActionPlaceholder.replace(
                        '{termijn}',
                        termijnLabel,
                      )}
                      className="mb-4 rounded-xl bg-surface-muted px-3.5"
                    />
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    disabled={!deadlineCanContinue}
                    onPress={submitDeadlineReview}
                    className={
                      'rounded-xl py-4 ' +
                      (deadlineCanContinue ? 'bg-primary active:bg-primary-dark' : 'bg-border')
                    }
                  >
                    <Text className="text-center font-semibold text-white">
                      {waarden.checkin.deadlineContinue} →
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          {phase === 'summary' && planSummary ? (
            <View>
              <Text className="mb-3 font-serif text-xl font-bold text-text">
                {waarden.checkin.summaryTitle}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPhase('main')}
                className="mb-5 rounded-xl bg-primary py-4 active:bg-primary-dark"
              >
                <Text className="text-center font-semibold text-white">
                  {waarden.checkin.summaryContinue} →
                </Text>
              </Pressable>
              <WaardenCheckinSummaryCard summary={planSummary} />
            </View>
          ) : null}

          {phase === 'main' ? (
            <View>
              <Text className="mb-5 font-serif text-xl font-bold leading-7 text-text">
                {waarden.checkin.question}
              </Text>

              <View className="mb-5 flex-row gap-2">
                <ChoiceButton
                  selected={keuze === 'ja'}
                  tone="ja"
                  label={waarden.checkin.yesLabel}
                  onPress={() => setKeuze('ja')}
                />
                <ChoiceButton
                  selected={keuze === 'neutraal'}
                  tone="neutraal"
                  label={waarden.checkin.neutralLabel}
                  onPress={() => setKeuze('neutraal')}
                />
                <ChoiceButton
                  selected={keuze === 'nee'}
                  tone="nee"
                  label={waarden.checkin.noLabel}
                  onPress={() => setKeuze('nee')}
                />
              </View>

              {keuze !== null ? (
                <View>
                  <AppTextInput
                    value={notitie}
                    onChangeText={setNotitie}
                    placeholder={notePlaceholder}
                    multiline
                    numberOfLines={3}
                    className="mb-4 rounded-xl bg-surface-muted px-3.5"
                    style={{ minHeight: 88 }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={submitMain}
                    className="rounded-xl bg-primary py-4 active:bg-primary-dark"
                  >
                    <Text className="text-center font-semibold text-white">
                      {waarden.checkin.finishAction} ✓
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </KeyboardAwareScrollScreen>
  );
}

function BinaryChoiceButton({
  selected,
  label,
  tone,
  onPress,
}: {
  selected: boolean;
  label: string;
  tone: 'positive' | 'negative' | 'neutral';
  onPress: () => void;
}) {
  const activeClass =
    tone === 'positive'
      ? 'border-primary bg-primary-soft'
      : tone === 'negative'
        ? 'border-crisis-border bg-crisis-soft'
        : 'border-border bg-surface-muted';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={
        'flex-1 items-center rounded-xl border-2 px-2 py-3 ' +
        (selected ? activeClass : 'border-border bg-surface-muted')
      }
    >
      <Text className="text-center text-xs font-semibold text-text">{label}</Text>
    </Pressable>
  );
}

function ChoiceButton({
  selected,
  tone,
  label,
  onPress,
}: {
  selected: boolean;
  tone: WaardeCheckinAntwoord;
  label: string;
  onPress: () => void;
}) {
  const activeClass =
    tone === 'ja'
      ? 'border-primary bg-primary-soft'
      : tone === 'nee'
        ? 'border-crisis-border bg-crisis-soft'
        : 'border-border bg-surface-muted';

  const iconColor = tone === 'ja' ? '#3B6D11' : tone === 'nee' ? '#D85A30' : '#888780';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={
        'flex-1 items-center rounded-2xl border-2 px-1 py-4 ' +
        (selected ? activeClass : 'border-border bg-surface-muted')
      }
    >
      <View className="mb-2">
        {tone === 'ja' ? (
          <CheckboxIcon size={30} color="#3B6D11" checked={selected} />
        ) : tone === 'nee' ? (
          <CrossIcon size={30} color={selected ? '#D85A30' : '#888780'} />
        ) : (
          <NeutralIcon size={30} color={selected ? '#5F5E5A' : iconColor} />
        )}
      </View>
      <Text className="text-center text-xs font-semibold text-text">{label}</Text>
    </Pressable>
  );
}
