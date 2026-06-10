import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckboxIcon } from '@/components/icons/CheckboxIcon';
import { CrossIcon } from '@/components/icons/CrossIcon';
import { NeutralIcon } from '@/components/icons/NeutralIcon';
import { WaardenCheckinSummaryCard } from '@/components/waarden/WaardenCheckinSummary';
import waarden from '@/content/nl/waarden.json';
import { isoDate } from '@/lib/mood';
import {
  buildCheckinSummary,
  pendingActieReviews,
  pendingCheckinWaarden,
  todayCheckinCount,
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

  const queue = useMemo(
    () => pendingCheckinWaarden(data.waarden, data.checkins, today),
    [data.waarden, data.checkins, today],
  );

  const [phase, setPhase] = useState<CheckinPhase>('main');
  const [deadlineIndex, setDeadlineIndex] = useState(0);

  const [keuze, setKeuze] = useState<WaardeCheckinAntwoord | null>(null);
  const [notitie, setNotitie] = useState('');

  const [behaald, setBehaald] = useState<boolean | null>(null);
  const [deadlineBeschrijving, setDeadlineBeschrijving] = useState('');
  const [wantsNewAction, setWantsNewAction] = useState<boolean | null>(null);
  const [nieuweActie, setNieuweActie] = useState('');

  // Always process the first pending waarde — the queue shrinks after each check-in.
  const current = queue[0] ?? null;
  const totalWaarden = data.waarden.length;
  const doneToday = todayCheckinCount(data.checkins, today);
  const progressCurrent = doneToday + 1;
  const progressPercent = totalWaarden > 0 ? (doneToday / totalWaarden) * 100 : 0;

  const deadlineQueue = useMemo(
    () => (current ? pendingActieReviews(data.acties, current.id, today) : []),
    [current, data.acties, today],
  );

  const planSummary = useMemo(
    () =>
      current
        ? buildCheckinSummary(
            data.acties,
            data.barriers,
            current.id,
            today,
            waarden.checkin.reminderTemplates,
            termijnLabels,
            barrierTypeLabels,
          )
        : null,
    [current, data.acties, data.barriers, today],
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

  // Fresh session when re-entering check-in (screen stays mounted in the tab stack).
  useFocusEffect(
    useCallback(() => {
      resetMainForm();
      resetDeadlineForm();
      setDeadlineIndex(0);
    }, []),
  );

  // Reset flow when advancing to the next pending waarde.
  useEffect(() => {
    if (!current) return;
    resetMainForm();
    resetDeadlineForm();
    setDeadlineIndex(0);
    const due = pendingActieReviews(data.acties, current.id, today);
    const summary = buildCheckinSummary(
      data.acties,
      data.barriers,
      current.id,
      today,
      waarden.checkin.reminderTemplates,
      termijnLabels,
      barrierTypeLabels,
    );
    setPhase(resolveInitialPhase(due, summary !== null));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: waarde id only
  }, [current?.id]);

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
    if (!current || keuze === null) return;
    addCheckin({
      waarde_id: current.id,
      datum: today,
      antwoord: keuze,
      notitie,
    });
    resetMainForm();
    resetDeadlineForm();
    setDeadlineIndex(0);
  }

  if (queue.length === 0) {
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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
        flexGrow: 1,
      }}
    >
      <View className="mx-auto w-full max-w-md">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mb-4 flex-row items-center gap-3"
        >
          <Text className="text-lg text-text-muted">‹</Text>
          <Text className="text-sm text-text-muted">{waarden.detail.back}</Text>
        </Pressable>

        {current ? (
          <View className="rounded-2xl bg-surface p-5 shadow-sm">
            <Text className="mb-2 text-sm text-text-muted">
              {waarden.checkin.progress
                .replace('{current}', String(progressCurrent))
                .replace('{total}', String(totalWaarden))}
            </Text>
            <View className="mb-6 h-1 overflow-hidden rounded-full bg-border">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${progressPercent}%` }}
              />
            </View>

            <View className="mb-2 flex-row items-center gap-2.5">
              <View className="h-3.5 w-3.5 rounded" style={{ backgroundColor: current.kleur }} />
              <Text className="font-serif text-xl font-bold text-text">{current.naam}</Text>
            </View>
            {current.beschrijving ? (
              <Text className="mb-5 text-sm text-text-subtle">{current.beschrijving}</Text>
            ) : (
              <View className="mb-5" />
            )}

            {phase === 'deadline' && currentDeadline ? (
              <View>
                <Text className="mb-1 font-serif text-xl font-bold text-text">
                  {waarden.checkin.deadlineTitle}
                </Text>
                <Text className="mb-4 text-sm text-text-subtle">
                  {waarden.checkin.deadlineIntro}
                </Text>

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
                    <TextInput
                      value={deadlineBeschrijving}
                      onChangeText={setDeadlineBeschrijving}
                      placeholder={waarden.checkin.deadlineDescriptionPlaceholder}
                      multiline
                      numberOfLines={3}
                      className="mb-4 min-h-[88px] rounded-xl border border-border bg-surface-muted px-3.5 py-3 text-base text-text"
                      placeholderTextColor="#888780"
                      textAlignVertical="top"
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
                      <TextInput
                        value={nieuweActie}
                        onChangeText={setNieuweActie}
                        placeholder={waarden.checkin.deadlineNewActionPlaceholder.replace(
                          '{termijn}',
                          termijnLabel,
                        )}
                        className="mb-4 rounded-xl border border-border bg-surface-muted px-3.5 py-3 text-base text-text"
                        placeholderTextColor="#888780"
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
                    <TextInput
                      value={notitie}
                      onChangeText={setNotitie}
                      placeholder={notePlaceholder}
                      multiline
                      numberOfLines={3}
                      className="mb-4 min-h-[88px] rounded-xl border border-border bg-surface-muted px-3.5 py-3 text-base text-text"
                      placeholderTextColor="#888780"
                      textAlignVertical="top"
                    />
                    <Pressable
                      accessibilityRole="button"
                      onPress={submitMain}
                      className="rounded-xl bg-primary py-4 active:bg-primary-dark"
                    >
                      <Text className="text-center font-semibold text-white">
                        {queue.length === 1
                          ? `${waarden.checkin.finishAction} ✓`
                          : `${waarden.checkin.nextAction} →`}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScrollView>
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

  const iconColor =
    tone === 'ja' ? '#3B6D11' : tone === 'nee' ? '#D85A30' : '#888780';

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
