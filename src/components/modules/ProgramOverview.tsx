import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { MODULE_META } from '@/lib/content';
import { getModuleStatus, MODULE_ORDER } from '@/lib/progress';
import common from '@/content/nl/common.json';
import type { ModuleStatus, UserProgress } from '@/types/content';

interface Props {
  progress: UserProgress;
}

/**
 * ProgramOverview — list of all 8 modules + the locked/in-progress/completed state.
 *
 * Tap on an unlocked module → routes to /onboarding (module 0) or /modules/<id>.
 * Locked modules render as disabled cards with a lock icon.
 */
export function ProgramOverview({ progress }: Props) {
  return (
    <View accessibilityLabel="Programma overzicht" className="gap-2">
      {MODULE_ORDER.map((moduleId, index) => {
        const status = getModuleStatus(moduleId, progress);
        const meta = MODULE_META[moduleId];
        const locked = status === 'locked';
        const href: Href =
          moduleId === 'onboarding'
            ? '/onboarding'
            : { pathname: '/modules/[id]', params: { id: moduleId } };

        if (locked) {
          return (
            <View
              key={moduleId}
              accessibilityLabel={common.progress.moduleLocked}
              className="flex-row items-center gap-3 rounded-2xl bg-surface-muted p-4 opacity-60"
            >
              <ModuleIndicator index={index} status={status} />
              <ModuleInfo meta={meta} status={status} />
              <Text className="text-lg text-locked">{'\u{1F512}'}</Text>
            </View>
          );
        }

        return (
          <Link key={moduleId} href={href} asChild>
            <Pressable
              accessibilityRole="link"
              className="flex-row items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft"
            >
              <ModuleIndicator index={index} status={status} />
              <ModuleInfo meta={meta} status={status} />
              <Text className="text-text-muted">{'›'}</Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

function ModuleIndicator({ index, status }: { index: number; status: ModuleStatus }) {
  const baseClass =
    'h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold flex';
  if (status === 'completed') {
    return (
      <View className={`${baseClass} bg-primary`}>
        <Text className="text-sm font-bold text-white">{'✓'}</Text>
      </View>
    );
  }
  if (status === 'in_progress') {
    return (
      <View className={`${baseClass} bg-primary-soft`}>
        <Text className="text-sm font-bold text-primary">{index}</Text>
      </View>
    );
  }
  if (status === 'available') {
    return (
      <View className={`${baseClass} border-2 border-primary`}>
        <Text className="text-sm font-bold text-primary">{index}</Text>
      </View>
    );
  }
  return (
    <View className={`${baseClass} border-2 border-border`}>
      <Text className="text-sm font-bold text-locked">{index}</Text>
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
      <Text className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {meta.phase}
      </Text>
      <Text className="font-semibold text-text" numberOfLines={1}>
        {meta.title}
      </Text>
      {status === 'in_progress' && (
        <Text className="mt-0.5 text-xs text-primary">{common.progress.moduleInProgress}</Text>
      )}
    </View>
  );
}
