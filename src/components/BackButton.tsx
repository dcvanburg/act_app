import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import common from '@/content/nl/common.json';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Top-left back control — 44pt touch target, chevron icon at readable size. */
export function BackButton({ onPress, accessibilityLabel = common.actions.back }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      className="-ml-1 h-11 w-11 items-center justify-center"
    >
      <Ionicons name="chevron-back" size={28} color="#888780" />
    </Pressable>
  );
}
