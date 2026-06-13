import { Pressable, Text, View } from 'react-native';

import chat from '@/content/nl/chat.json';

/**
 * Interactive clarify card: question text plus tappable options that send
 * immediately as the next user message.
 */
export function ClarifyCard({
  prompt,
  options,
  onPick,
  onTypeOwn,
}: {
  prompt?: string;
  options: string[];
  onPick: (question: string) => void;
  onTypeOwn: () => void;
}) {
  if (options.length === 0) return null;

  return (
    <View className="mb-4 self-start max-w-[85%]">
      <View className="rounded-2xl rounded-bl border border-primary-border-soft bg-primary-soft px-4 py-3">
        {prompt ? <Text className="mb-3 text-base text-text">{prompt}</Text> : null}
        <Text className="mb-2 text-xs font-medium text-text-muted">{chat.clarify.prompt}</Text>
        <View className="gap-2">
          {options.map((q) => (
            <Pressable
              key={q}
              accessibilityRole="button"
              accessibilityLabel={q}
              onPress={() => onPick(q)}
              className="min-h-[44px] justify-center rounded-xl border border-primary-border-soft bg-surface px-3 py-2 active:bg-primary-soft"
            >
              <Text className="text-sm font-medium text-primary-dark">{q}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chat.clarify.typeOwn}
            onPress={onTypeOwn}
            className="min-h-[44px] justify-center rounded-xl border border-dashed border-border bg-background px-3 py-2 active:bg-surface"
          >
            <Text className="text-sm text-text-subtle">{chat.clarify.typeOwn}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
