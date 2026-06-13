import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChatIcon } from '@/components/icons/ChatIcon';
import chat from '@/content/nl/chat.json';

/**
 * Home-screen chatbot entry card. Sits below ProgramHomeCard on /home.
 * Visibility gated by EXPO_PUBLIC_ENABLE_CHATBOT
 * in the parent screen, not here — this component assumes it should render
 * when included.
 */
export function ChatHomeCard() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={chat.homeCard.title}
      onPress={() => router.push('/chat')}
      className="mb-4 flex-row items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
        <ChatIcon size={28} color="#3B6D11" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-text">{chat.homeCard.title}</Text>
        <Text className="text-sm text-text-subtle">{chat.homeCard.body}</Text>
      </View>
      <Text className="text-text-muted">›</Text>
    </Pressable>
  );
}
