import { Pressable, Text, View } from 'react-native';

import mood from '@/content/nl/mood.json';
import type { EmotionTag } from '@/types/content';

const tags = mood.tags as { id: EmotionTag; label: string }[];

interface Props {
  value: EmotionTag[];
  onChange: (next: EmotionTag[]) => void;
  disabled?: boolean;
}

/**
 * Multi-select chip row for emotion tags. Order in the JSON is intentional:
 * we lead with the difficult emotions (angst, verdriet, boos, stress) and then
 * the resourceful ones (rustig, hoopvol) so the most-relevant words for a low
 * mood are at the top of a wrapping list.
 */
export function EmotionTagPicker({ value, onChange, disabled }: Props) {
  function toggle(id: EmotionTag) {
    if (disabled) return;
    const next = value.includes(id) ? value.filter((t) => t !== id) : [...value, id];
    onChange(next);
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {tags.map((tag) => {
        const selected = value.includes(tag.id);
        return (
          <Pressable
            key={tag.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected, disabled: !!disabled }}
            onPress={() => toggle(tag.id)}
            className={
              'rounded-full border px-3 py-2 ' +
              (selected
                ? 'border-primary bg-primary-soft'
                : 'border-border bg-surface active:bg-primary-soft')
            }
          >
            <Text
              className={
                'text-sm ' + (selected ? 'font-semibold text-primary-dark' : 'text-text-subtle')
              }
            >
              {tag.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
