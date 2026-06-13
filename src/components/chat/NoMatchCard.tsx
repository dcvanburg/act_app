import { Pressable, Text, View } from 'react-native';

import chat from '@/content/nl/chat.json';

/**
 * Shown when RAG retrieval finds no matching program content. Offers tappable
 * suggestions so the user can try a question the chatbot can answer.
 */
export function NoMatchCard({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (question: string) => void;
}) {
  return (
    <View className="mb-4 self-start max-w-full rounded-2xl border border-border bg-surface p-4">
      <Text className="mb-1 font-semibold text-text">{chat.noMatch.title}</Text>
      <Text className="mb-3 text-sm text-text-subtle">{chat.noMatch.body}</Text>
      <Text className="mb-2 text-xs font-medium text-text-muted">{chat.noMatch.prompt}</Text>
      <View className="gap-2">
        {suggestions.map((q) => (
          <Pressable
            key={q}
            accessibilityRole="button"
            accessibilityLabel={q}
            onPress={() => onPick(q)}
            className="rounded-xl border border-primary-border-soft bg-primary-soft px-3 py-2 active:bg-primary-border-soft"
          >
            <Text className="text-sm text-primary-dark">{q}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
