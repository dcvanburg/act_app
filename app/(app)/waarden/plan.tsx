import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/AppTextInput';
import { KeyboardAwareScrollScreen } from '@/components/KeyboardAwareScrollScreen';
import { BackButton } from '@/components/BackButton';
import { AvoidIcon } from '@/components/icons/AvoidIcon';
import { BarrierTabIcon } from '@/components/icons/BarrierTabIcon';
import { BoltIcon } from '@/components/icons/BoltIcon';
import { CalendarIcon } from '@/components/icons/CalendarIcon';
import { HistoryTabIcon } from '@/components/icons/HistoryTabIcon';
import { MirrorIcon } from '@/components/icons/MirrorIcon';
import { PlanTabIcon } from '@/components/icons/PlanTabIcon';
import { TargetIcon } from '@/components/icons/TargetIcon';
import { ThoughtIcon } from '@/components/icons/ThoughtIcon';
import { CheckinAntwoordIcon } from '@/components/waarden/CheckinAntwoordIcon';
import waarden from '@/content/nl/waarden.json';
import {
  collectionActies,
  collectionBarriers,
  collectionCheckins,
  formatWaardeDate,
  last14Days,
} from '@/lib/waarden';
import { useWaarden } from '@/providers/WaardenProvider';
import type {
  BarriereType,
  WaardeBarriere,
  WaardeCheckinAntwoord,
  WaardeTermijn,
} from '@/types/waarden';

type DetailTab = 'plan' | 'barriers' | 'historie';

const BARRIER_TYPES: BarriereType[] = ['vermijding', 'gedachte', 'zelfkritiek', 'eigen'];

interface BarrierGroup {
  key: string;
  type: BarriereType;
  label: string;
  items: WaardeBarriere[];
}

function groupBarriers(barriers: WaardeBarriere[]): BarrierGroup[] {
  const groups: BarrierGroup[] = [];

  for (const barrierType of BARRIER_TYPES) {
    if (barrierType === 'eigen') continue;
    const items = barriers.filter((item) => item.type === barrierType);
    if (items.length > 0) {
      groups.push({
        key: barrierType,
        type: barrierType,
        label: waarden.barrierTypes[barrierType],
        items,
      });
    }
  }

  const eigenItems = barriers.filter((item) => item.type === 'eigen');
  const eigenLabels = [
    ...new Set(eigenItems.map((item) => item.eigenLabel?.trim() || waarden.barrierTypes.eigen)),
  ];

  for (const label of eigenLabels) {
    const items = eigenItems.filter(
      (item) => (item.eigenLabel?.trim() || waarden.barrierTypes.eigen) === label,
    );
    if (items.length > 0) {
      groups.push({
        key: `eigen-${label}`,
        type: 'eigen',
        label,
        items,
      });
    }
  }

  return groups;
}

function barrierTypeLabel(type: BarriereType): string {
  return waarden.barrierTypes[type];
}

function BarrierTypeIcon({
  type,
  size = 16,
  color = '#3B6D11',
}: {
  type: BarriereType;
  size?: number;
  color?: string;
}) {
  if (type === 'vermijding') return <AvoidIcon size={size} color={color} />;
  if (type === 'gedachte') return <ThoughtIcon size={size} color={color} />;
  if (type === 'eigen') return <BoltIcon size={size} color={color} />;
  return <MirrorIcon size={size} color={color} />;
}

export default function WaardenPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, addActie, deleteActie, addBarriere, deleteBarriere } = useWaarden();
  const [tab, setTab] = useState<DetailTab>('plan');

  if (data.waarden.length === 0) {
    return <Redirect href="/waarden/new" />;
  }

  const acties = collectionActies(data.acties);
  const barriers = collectionBarriers(data.barriers);
  const checkins = collectionCheckins(data.checkins);

  return (
    <KeyboardAwareScrollScreen
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
      }}
    >
      <View className="mx-auto w-full max-w-md gap-4">
        <View className="flex-row items-center gap-1">
          <BackButton onPress={() => router.back()} />
          <Text className="flex-1 font-serif text-xl font-bold text-text">
            {waarden.collection.title}
          </Text>
        </View>

        <View className="rounded-2xl bg-surface p-4 shadow-sm">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
            {waarden.collection.valuesHeading}
          </Text>
          <View className="flex-row flex-wrap gap-2">
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
        </View>

        <View className="flex-row gap-2">
          <TabButton
            tab="plan"
            label={waarden.detail.tabPlan}
            active={tab === 'plan'}
            onPress={() => setTab('plan')}
          />
          <TabButton
            tab="barriers"
            label={waarden.detail.tabBarriers}
            active={tab === 'barriers'}
            onPress={() => setTab('barriers')}
          />
          <TabButton
            tab="historie"
            label={waarden.detail.tabHistory}
            active={tab === 'historie'}
            onPress={() => setTab('historie')}
          />
        </View>

        {tab === 'plan' ? (
          <PlanTab acties={acties} onAdd={addActie} onDelete={deleteActie} />
        ) : null}
        {tab === 'barriers' ? (
          <BarriersTab barriers={barriers} onAdd={addBarriere} onDelete={deleteBarriere} />
        ) : null}
        {tab === 'historie' ? <HistoryTab checkins={checkins} /> : null}
      </View>
    </KeyboardAwareScrollScreen>
  );
}

function TabButton({
  tab,
  label,
  active,
  onPress,
}: {
  tab: DetailTab;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? '#27500A' : '#888780';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={
        'flex-1 flex-row items-center justify-center gap-1.5 rounded-full border px-2 py-2 ' +
        (active
          ? 'border-primary bg-primary-soft'
          : 'border-border bg-surface active:bg-primary-soft')
      }
    >
      {tab === 'plan' ? (
        <PlanTabIcon size={16} color={color} />
      ) : tab === 'barriers' ? (
        <BarrierTabIcon size={16} color={color} />
      ) : (
        <HistoryTabIcon size={16} color={color} />
      )}
      <Text
        className={'text-sm ' + (active ? 'font-semibold text-primary-dark' : 'text-text-muted')}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PlanTab({
  acties,
  onAdd,
  onDelete,
}: {
  acties: { id: string; termijn: WaardeTermijn; actie: string }[];
  onAdd: (termijn: WaardeTermijn, actie: string) => void;
  onDelete: (id: string) => void;
}) {
  const blocks: { termijn: WaardeTermijn; title: string; sub: string }[] = [
    { termijn: 'kort', title: waarden.detail.shortTerm, sub: waarden.detail.shortTermSub },
    { termijn: 'middel', title: waarden.detail.mediumTerm, sub: waarden.detail.mediumTermSub },
    { termijn: 'lang', title: waarden.detail.longTerm, sub: waarden.detail.longTermSub },
  ];

  return (
    <View className="gap-3.5">
      {blocks.map((block) => (
        <TermijnBlock
          key={block.termijn}
          termijn={block.termijn}
          title={block.title}
          sub={block.sub}
          items={acties.filter((item) => item.termijn === block.termijn)}
          placeholder={waarden.detail.actionPlaceholder}
          onAdd={(text) => onAdd(block.termijn, text)}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

function TermijnBlock({
  termijn,
  title,
  sub,
  items,
  placeholder,
  onAdd,
  onDelete,
}: {
  termijn: WaardeTermijn;
  title: string;
  sub: string;
  items: { id: string; actie: string }[];
  placeholder: string;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [input, setInput] = useState('');

  function submit() {
    if (!input.trim()) return;
    onAdd(input);
    setInput('');
  }

  return (
    <View className="rounded-2xl bg-surface p-4 shadow-sm">
      <View className="mb-3 flex-row items-center gap-2.5">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
          {termijn === 'kort' ? (
            <BoltIcon size={18} color="#3B6D11" />
          ) : termijn === 'middel' ? (
            <CalendarIcon size={18} color="#3B6D11" />
          ) : (
            <TargetIcon size={18} color="#3B6D11" />
          )}
        </View>
        <View>
          <Text className="text-sm font-semibold text-text">{title}</Text>
          <Text className="text-xs text-text-muted">{sub}</Text>
        </View>
      </View>
      {items.map((item) => (
        <View
          key={item.id}
          className="mb-2 flex-row items-start gap-2.5 rounded-xl bg-surface-muted p-2.5"
        >
          <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          <Text className="flex-1 text-sm leading-5 text-text">{item.actie}</Text>
          <Pressable accessibilityRole="button" onPress={() => onDelete(item.id)} className="px-1">
            <Text className="text-base text-locked">×</Text>
          </Pressable>
        </View>
      ))}
      <View className="mt-1 flex-row gap-2">
        <AppTextInput
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          onSubmitEditing={submit}
          returnKeyType="done"
          compact
          className="flex-1 rounded-xl bg-surface-muted px-3"
        />
        <Pressable
          accessibilityRole="button"
          onPress={submit}
          className="items-center justify-center rounded-xl bg-primary px-3.5 active:bg-primary-dark"
        >
          <Text className="text-xl text-white">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BarriersTab({
  barriers,
  onAdd,
  onDelete,
}: {
  barriers: WaardeBarriere[];
  onAdd: (type: BarriereType, text: string, eigenLabel?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [type, setType] = useState<BarriereType>('vermijding');
  const [eigenLabel, setEigenLabel] = useState('');
  const [input, setInput] = useState('');

  function submit() {
    if (!input.trim()) return;
    if (type === 'eigen' && !eigenLabel.trim()) return;
    onAdd(type, input, type === 'eigen' ? eigenLabel : undefined);
    setInput('');
    if (type === 'eigen') setEigenLabel('');
  }

  const grouped = useMemo(() => groupBarriers(barriers), [barriers]);

  return (
    <View>
      <View className="mb-4 rounded-xl border border-primary-border-soft bg-primary-soft px-3.5 py-3">
        <Text className="text-sm leading-5 text-primary-dark">{waarden.detail.barriersIntro}</Text>
      </View>

      {grouped.length === 0 ? (
        <Text className="mb-4 text-sm italic text-text-muted">{waarden.detail.barriersEmpty}</Text>
      ) : (
        grouped.map((group) => (
          <View key={group.key} className="mb-3">
            <View className="mb-2 flex-row items-center gap-2">
              <BarrierTypeIcon type={group.type} size={16} color="#3B6D11" />
              <Text className="text-sm font-semibold text-text">{group.label}</Text>
            </View>
            {group.items.map((item) => (
              <View
                key={item.id}
                className="mb-2 flex-row items-start gap-2 rounded-xl bg-surface px-3 py-2.5 shadow-sm"
              >
                <Text className="flex-1 text-sm italic leading-5 text-text-subtle">
                  &ldquo;{item.omschrijving}&rdquo;
                </Text>
                <Pressable accessibilityRole="button" onPress={() => onDelete(item.id)}>
                  <Text className="text-base text-locked">×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ))
      )}

      <View className="rounded-2xl bg-surface p-4 shadow-sm">
        <Text className="mb-2.5 text-sm font-semibold text-text">
          {waarden.detail.addBarrierTitle}
        </Text>
        <View className="mb-2.5 flex-row flex-wrap gap-2">
          {BARRIER_TYPES.map((barrierType) => (
            <Pressable
              key={barrierType}
              accessibilityRole="button"
              onPress={() => setType(barrierType)}
              className={
                'flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ' +
                (type === barrierType
                  ? 'border-primary bg-primary-soft'
                  : 'border-border bg-surface-muted')
              }
            >
              <BarrierTypeIcon
                type={barrierType}
                size={14}
                color={type === barrierType ? '#27500A' : '#888780'}
              />
              <Text
                className={
                  'text-xs font-semibold ' +
                  (type === barrierType ? 'text-primary-dark' : 'text-text-subtle')
                }
              >
                {barrierTypeLabel(barrierType)}
              </Text>
            </Pressable>
          ))}
        </View>
        {type === 'eigen' ? (
          <View className="mb-2.5">
            <Text className="mb-1.5 text-xs font-medium text-text-subtle">
              {waarden.detail.customBarrierLabel}
            </Text>
            <AppTextInput
              value={eigenLabel}
              onChangeText={setEigenLabel}
              placeholder={waarden.detail.customBarrierPlaceholder}
              returnKeyType="next"
              compact
              className="rounded-xl bg-surface-muted px-3"
            />
          </View>
        ) : null}
        <View className="flex-row gap-2">
          <AppTextInput
            value={input}
            onChangeText={setInput}
            placeholder={waarden.detail.barrierPlaceholder}
            onSubmitEditing={submit}
            returnKeyType="done"
            compact
            className="flex-1 rounded-xl bg-surface-muted px-3"
          />
          <Pressable
            accessibilityRole="button"
            onPress={submit}
            className="items-center justify-center rounded-xl bg-primary px-3.5 active:bg-primary-dark"
          >
            <Text className="text-xl text-white">+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function HistoryTab({
  checkins,
}: {
  checkins: { id: string; datum: string; antwoord: WaardeCheckinAntwoord; notitie: string }[];
}) {
  const days = last14Days();

  return (
    <View className="rounded-2xl bg-surface p-4 shadow-sm">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {waarden.detail.historyRange}
      </Text>
      <View className="mb-5 flex-row flex-wrap gap-1.5">
        {days.map((day) => {
          const entry = checkins.find((item) => item.datum === day);
          const dayNum = new Date(`${day}T12:00:00`).getDate();
          const style = heatmapStyle(entry?.antwoord);
          return (
            <View key={day} className="items-center">
              <View className={`mb-1 h-8 w-8 items-center justify-center rounded-lg ${style.bg}`}>
                <CheckinAntwoordIcon antwoord={entry?.antwoord} />
              </View>
              <Text className="text-[9px] text-text-muted">{dayNum}</Text>
            </View>
          );
        })}
      </View>

      {checkins.length === 0 ? (
        <Text className="py-8 text-center text-sm text-text-muted">
          {waarden.detail.historyEmpty}
        </Text>
      ) : (
        [...checkins]
          .slice(-20)
          .reverse()
          .map((entry) => (
            <View
              key={entry.id}
              className={`mb-2 rounded-xl border-l-[3px] bg-surface-muted px-4 py-3 ${historyBorderClass(entry.antwoord)}`}
            >
              <Text className="text-xs text-text-muted">{formatWaardeDate(entry.datum)}</Text>
              <View className="mt-1 flex-row items-center gap-2">
                <CheckinAntwoordIcon antwoord={entry.antwoord} size={16} />
                <Text className="flex-1 text-sm text-text">{checkinLabel(entry.antwoord)}</Text>
              </View>
              {entry.notitie ? (
                <Text className="mt-1 text-sm italic text-text-subtle">
                  &ldquo;{entry.notitie}&rdquo;
                </Text>
              ) : null}
            </View>
          ))
      )}
    </View>
  );
}

function heatmapStyle(antwoord: WaardeCheckinAntwoord | undefined): { bg: string } {
  if (antwoord === 'ja') return { bg: 'bg-primary-soft' };
  if (antwoord === 'neutraal') return { bg: 'bg-surface-muted' };
  if (antwoord === 'nee') return { bg: 'bg-crisis-soft' };
  return { bg: 'bg-border' };
}

function historyBorderClass(antwoord: WaardeCheckinAntwoord): string {
  if (antwoord === 'ja') return 'border-primary';
  if (antwoord === 'nee') return 'border-crisis';
  return 'border-border';
}

function checkinLabel(antwoord: WaardeCheckinAntwoord): string {
  if (antwoord === 'ja') return waarden.checkin.handledYes;
  if (antwoord === 'neutraal') return waarden.checkin.handledNeutral;
  return waarden.checkin.handledNo;
}
