import { ActivityIndicator, Text, View } from 'react-native';

import chat from '@/content/nl/chat.json';

/** Shown while the search Edge Function is in flight. */
export function TypingIndicator() {
  return (
    <View className="mb-3 max-w-[85%] flex-col self-start items-start">
      <Text className="mb-1 text-xs text-text-muted">{chat.assistantLabel}</Text>
      <View className="flex-row items-center gap-2 rounded-2xl rounded-bl border border-primary-border-soft bg-primary-soft px-4 py-3">
        <ActivityIndicator size="small" color="#3B6D11" />
        <Text className="text-sm text-text-subtle">{chat.thinking}</Text>
      </View>
    </View>
  );
}
