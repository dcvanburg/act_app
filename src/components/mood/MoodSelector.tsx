import { Pressable, Text, View } from 'react-native';

import mood from '@/content/nl/mood.json';
import type { MoodScore } from '@/types/content';

const scores = mood.scores as { value: MoodScore; emoji: string; label: string }[];

interface Props {
  value: MoodScore | null;
  onChange: (v: MoodScore) => void;
  disabled?: boolean;
}

/**
 * 5-emoji mood selector. Highest emotional resolution that fits a single row
 * on a phone screen — bigger scales (PHQ / 7-point Likert) feel clinical and
 * push the user out of the affective moment.
 */
export function MoodSelector({ value, onChange, disabled }: Props) {
  return (
    <View>
      <View className="flex-row items-stretch justify-between gap-2">
        {scores.map((s) => {
          const selected = value === s.value;
          return (
            <Pressable
              key={s.value}
              accessibilityRole="radio"
              accessibilityLabel={s.label}
              accessibilityState={{ selected, disabled: !!disabled }}
              onPress={() => !disabled && onChange(s.value)}
              className={
                'flex-1 items-center rounded-2xl border-2 p-3 ' +
                (selected
                  ? 'border-primary bg-primary-soft'
                  : 'border-border bg-surface active:bg-primary-soft')
              }
            >
              <Text className="text-3xl">{s.emoji}</Text>
            </Pressable>
          );
        })}
      </View>
      {value !== null ? (
        <Text className="mt-3 text-center text-sm font-medium text-text">
          {scores.find((s) => s.value === value)?.label}
        </Text>
      ) : null}
    </View>
  );
}
