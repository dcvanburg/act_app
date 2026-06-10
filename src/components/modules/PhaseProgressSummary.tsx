import { Text, View } from 'react-native';

import common from '@/content/nl/common.json';
import type { PhaseProgress } from '@/lib/progress';

const NODE_SIZE = 40;
const LINE_TOP = NODE_SIZE / 2 - 1;

interface Props {
  phases: PhaseProgress[];
}

/**
 * Horizontal phase stepper: Start → Fundament → Kern → Leven.
 * Shown at the top of the /modules tab.
 */
export function PhaseProgressSummary({ phases }: Props) {
  const completedModules = phases.reduce((sum, p) => sum + p.completedCount, 0);
  const totalModules = phases.reduce((sum, p) => sum + p.totalCount, 0);
  const edgeInset = `${100 / phases.length / 2}%`;

  return (
    <View className="mb-6 rounded-2xl bg-surface p-5 shadow-sm">
      <View className="mb-4 flex-row items-baseline justify-between">
        <Text className="font-serif text-lg font-bold text-text">{common.program.title}</Text>
        <Text className="text-sm font-medium text-primary">
          {completedModules}/{totalModules}
        </Text>
      </View>

      <View className="relative flex-row">
        <View
          pointerEvents="none"
          className="absolute flex-row"
          style={{ top: LINE_TOP, left: edgeInset as `${number}%`, right: edgeInset as `${number}%`, height: 2 }}
        >
          {phases.slice(0, -1).map((phase) => (
            <View
              key={`line-${phase.id}`}
              className={
                'h-0.5 flex-1 ' + (phase.status === 'completed' ? 'bg-primary' : 'bg-border')
              }
            />
          ))}
        </View>

        {phases.map((phase) => (
          <View key={phase.id} className="flex-1 items-center">
            <View className="z-10">
              <PhaseNode phase={phase} />
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              className={
                'mt-2 w-full text-center text-xs font-semibold ' +
                (phase.status === 'current'
                  ? 'text-primary-dark'
                  : phase.status === 'completed'
                    ? 'text-primary'
                    : 'text-text-muted')
              }
            >
              {phase.label}
            </Text>
            <Text className="mt-0.5 w-full text-center text-[10px] text-text-muted">
              {phase.completedCount}/{phase.totalCount}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PhaseNode({ phase }: { phase: PhaseProgress }) {
  const base = 'h-10 w-10 items-center justify-center rounded-full border-2';

  if (phase.status === 'completed') {
    return (
      <View className={`${base} border-primary bg-primary`}>
        <Text className="text-sm font-bold text-white">✓</Text>
      </View>
    );
  }

  if (phase.status === 'current') {
    return (
      <View className={`${base} border-primary bg-primary-soft`}>
        <Text className="text-xs font-bold text-primary-dark">
          {phase.completedCount}/{phase.totalCount}
        </Text>
      </View>
    );
  }

  return (
    <View className={`${base} border-border bg-surface-muted`}>
      <Text className="text-xs font-bold text-locked">
        {phase.completedCount}/{phase.totalCount}
      </Text>
    </View>
  );
}
