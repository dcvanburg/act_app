import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatIcon } from '@/components/icons/ChatIcon';
import chat from '@/content/nl/chat.json';
import { BOTTOM_CHROME, fabBottomOffset } from '@/lib/bottom-chrome';

const CHATBOT_ENABLED = (process.env.EXPO_PUBLIC_ENABLE_CHATBOT ?? 'true') !== 'false';

/**
 * ChatFloatingButton — persistent chat entry, mounted in the authenticated app layout.
 *
 * Bottom-right overlay (Noodknop sits bottom-left). Hidden on /chat and during
 * onboarding, matching the emergency button visibility rules.
 */
export function ChatFloatingButton() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { from } = useGlobalSearchParams<{ from?: string }>();

  if (!CHATBOT_ENABLED) return null;
  if (pathname === '/chat') return null;
  if (pathname === '/wizard' || pathname === '/onboarding' || from === 'onboarding') return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: fabBottomOffset(insets.bottom, BOTTOM_CHROME.chatFabSize),
        alignItems: 'flex-end',
        paddingHorizontal: BOTTOM_CHROME.edgePadding,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={chat.floatingButton.label}
        onPress={() => router.push('/chat')}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:bg-primary-dark"
        style={{ minHeight: 56, minWidth: 56 }}
      >
        <ChatIcon size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
