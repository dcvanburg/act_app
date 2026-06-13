import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import chat from '@/content/nl/chat.json';

/**
 * Crisis deflection card. Shown when either the local pre-filter or the
 * server bypass returns crisis:true. Offers a primary route to /noodhulp
 * and a secondary route back to the program.
 */
export function CrisisCard() {
  const router = useRouter();

  return (
    <View className="mb-4 self-start max-w-full rounded-2xl border border-crisis-border bg-crisis-soft p-4">
      <Text className="mb-1 font-semibold text-crisis-dark">{chat.crisisDeflection.title}</Text>
      <Text className="mb-3 text-text">{chat.crisisDeflection.body}</Text>
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={chat.crisisDeflection.actionPrimary}
          onPress={() => router.push('/noodhulp')}
          className="rounded-lg bg-crisis-dark px-4 py-2 active:opacity-80"
        >
          <Text className="font-medium text-white">{chat.crisisDeflection.actionPrimary}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={chat.crisisDeflection.actionSecondary}
          onPress={() => router.replace('/home')}
          className="rounded-lg border border-crisis-border px-4 py-2 active:opacity-80"
        >
          <Text className="text-crisis-dark">{chat.crisisDeflection.actionSecondary}</Text>
        </Pressable>
      </View>
    </View>
  );
}
