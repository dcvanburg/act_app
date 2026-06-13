import { Pressable, Text, View } from 'react-native';

import chat from '@/content/nl/chat.json';

/**
 * Tappable options when the gids needs clarification before answering.
 * The clarify question itself is shown in the preceding MessageBubble.
 */
export function ClarifyCard({
  options,
  onPick,
  onTypeOwn,
}: {
  options: string[];
  onPick: (question: string) => void;
  onTypeOwn: () => void;
}) {
  if (options.length === 0) return null;

  return (
    <View className="mb-4 self-start max-w-full rounded-2xl border border-primary-border-soft bg-primary-soft/40 p-4">
      <Text className="mb-2 text-xs font-medium text-text-muted">{chat.clarify.prompt}</Text>
      <View className="gap-2">
        {options.map((q) => (
          <Pressable
            key={q}
            accessibilityRole="button"
            accessibilityLabel={q}
            onPress={() => onPick(q)}
            className="rounded-xl border border-primary-border-soft bg-surface px-3 py-2 active:bg-primary-soft"
          >
            <Text className="text-sm text-primary-dark">{q}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={chat.clarify.typeOwn}
          onPress={onTypeOwn}
          className="rounded-xl border border-dashed border-border bg-background px-3 py-2 active:bg-surface"
        >
          <Text className="text-sm text-text-subtle">{chat.clarify.typeOwn}</Text>
        </Pressable>
      </View>
    </View>
  );
}
