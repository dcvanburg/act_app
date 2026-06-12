import { Text, View } from 'react-native';

import chat from '@/content/nl/chat.json';

export type MessageRole = 'user' | 'assistant';

interface Props {
  role: MessageRole;
  content: string;
}

/**
 * Single chat bubble. Left-aligned for assistant, right-aligned for the user.
 * Tone-on-tone with the brand palette: assistant on `primary-soft`, user on
 * `primary`.
 */
export function MessageBubble({ role, content }: Props) {
  const isUser = role === 'user';

  return (
    <View
      className={`mb-3 max-w-[85%] flex-col ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
    >
      <Text className="mb-1 text-xs text-text-muted">
        {isUser ? chat.youLabel : chat.assistantLabel}
      </Text>
      <View
        className={
          isUser
            ? 'rounded-2xl rounded-br bg-primary px-4 py-3'
            : 'rounded-2xl rounded-bl border border-primary-border-soft bg-primary-soft px-4 py-3'
        }
      >
        <Text className={isUser ? 'text-base text-white' : 'text-base text-text'}>{content}</Text>
      </View>
    </View>
  );
}
