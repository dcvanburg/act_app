import { Link, type Href } from 'expo-router';
import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AccountIcon } from '@/components/icons/AccountIcon';
import { BoltIcon } from '@/components/icons/BoltIcon';
import { CheckboxIcon } from '@/components/icons/CheckboxIcon';
import { FlameIcon } from '@/components/icons/FlameIcon';
import { MirrorIcon } from '@/components/icons/MirrorIcon';
import { StarIcon } from '@/components/icons/StarIcon';
import { TargetIcon } from '@/components/icons/TargetIcon';
import { ThoughtIcon } from '@/components/icons/ThoughtIcon';
import { MODULE_META } from '@/lib/content';
import { getModuleStatus, MODULE_ORDER, PROGRAM_PHASES } from '@/lib/progress';
import common from '@/content/nl/common.json';
import type { ModuleId, ModuleStatus, UserProgress } from '@/types/content';

type IconProps = { size?: number; color?: string };

const MODULE_ICONS: Record<ModuleId, ComponentType<IconProps>> = {
  onboarding: StarIcon,
  recognition: ThoughtIcon,
  acceptance: MirrorIcon,
  defusion: BoltIcon,
  presence: FlameIcon,
  'self-as-context': AccountIcon,
  values: TargetIcon,
  'committed-action': CheckboxIcon,
};

interface Props {
  progress: UserProgress;
  /** Group modules under Start / Fundament / Kern / Leven headers. */
  groupByPhase?: boolean;
}

/**
 * ProgramOverview — list of all 8 modules + the locked/in-progress/completed state.
 *
 * Tap on an unlocked module → routes to /modules/onboarding (module 0) or /modules/<id>.
 * Locked modules render as disabled cards with a lock icon.
 */
export function ProgramOverview({ progress, groupByPhase = false }: Props) {
  if (!groupByPhase) {
    return (
      <View accessibilityLabel="Programma overzicht" className="gap-2">
        {MODULE_ORDER.map((moduleId, index) => (
          <ModuleRow key={moduleId} moduleId={moduleId} index={index} progress={progress} />
        ))}
      </View>
    );
  }

  return (
    <View accessibilityLabel="Programma overzicht" className="gap-6">
      {PROGRAM_PHASES.map((phase) => (
        <View key={phase.id}>
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {phase.label}
          </Text>
          <View className="gap-2">
            {phase.moduleIds.map((moduleId) => {
              const index = MODULE_ORDER.indexOf(moduleId);
              return (
                <ModuleRow key={moduleId} moduleId={moduleId} index={index} progress={progress} />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function ModuleRow({
  moduleId,
  progress,
}: {
  moduleId: ModuleId;
  index: number;
  progress: UserProgress;
}) {
  const status = getModuleStatus(moduleId, progress);
  const meta = MODULE_META[moduleId];
  const locked = status === 'locked';
  const href: Href =
    moduleId === 'onboarding'
      ? '/modules/onboarding'
      : { pathname: '/modules/[id]', params: { id: moduleId } };
  const IconComponent = MODULE_ICONS[moduleId];

  if (locked) {
    return (
      <View
        accessibilityLabel={common.progress.moduleLocked}
        className="flex-row items-center gap-3 rounded-2xl bg-surface-muted p-4 opacity-60"
      >
        <ModuleIndicator status={status} icon={IconComponent} />
        <ModuleInfo meta={meta} status={status} />
        <Text className="text-lg text-locked">{'\u{1F512}'}</Text>
      </View>
    );
  }

  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        className="flex-row items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft"
      >
        <ModuleIndicator status={status} icon={IconComponent} />
        <ModuleInfo meta={meta} status={status} />
        <Text className="text-text-muted">{'›'}</Text>
      </Pressable>
    </Link>
  );
}

function ModuleIndicator({
  status,
  icon: Icon,
}: {
  status: ModuleStatus;
  icon: ComponentType<IconProps>;
}) {
  const base = 'h-10 w-10 flex-shrink-0 items-center justify-center rounded-full';
  if (status === 'completed') {
    return (
      <View className={`${base} bg-primary`}>
        <Text className="text-sm font-bold text-white">{'✓'}</Text>
      </View>
    );
  }
  if (status === 'in_progress') {
    return (
      <View className={`${base} bg-primary-soft`}>
        <Icon size={20} color="#3B6D11" />
      </View>
    );
  }
  if (status === 'available') {
    return (
      <View className={`${base} border-2 border-primary`}>
        <Icon size={20} color="#3B6D11" />
      </View>
    );
  }
  return (
    <View className={`${base} border-2 border-border`}>
      <Icon size={20} color="#B4B2A9" />
    </View>
  );
}

function ModuleInfo({
  meta,
  status,
}: {
  meta: { title: string; phase: string };
  status: ModuleStatus;
}) {
  return (
    <View className="flex-1">
      <Text className="font-semibold text-text" numberOfLines={1}>
        {meta.title}
      </Text>
      {status === 'in_progress' && (
        <Text className="mt-0.5 text-xs text-primary">{common.progress.moduleInProgress}</Text>
      )}
      {status === 'completed' && (
        <Text className="mt-0.5 text-xs text-text-muted">{common.progress.moduleCompleted}</Text>
      )}
    </View>
  );
}
