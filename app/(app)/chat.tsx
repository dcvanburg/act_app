import { useRouter, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { ChatComposer, type ChatComposerHandle } from '@/components/chat/ChatComposer';
import { CrisisCard } from '@/components/chat/CrisisCard';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { NoMatchCard } from '@/components/chat/NoMatchCard';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import chat from '@/content/nl/chat.json';
import { ensureQuestionMarks } from '@/lib/chat-punctuation';
import { defaultTabBarStyle, hiddenTabBarStyle } from '@/lib/tab-bar';
import {
  ACTIVE_CHAT_SESSION_KEY,
  useActiveChatSession,
  useChatMessages,
  useClearCurrentChat,
  useInsertChatMessage,
} from '@/lib/chat-messages-queries';
import { pickChatOpeningSuggestions } from '@/lib/chat-opening-suggestions';
import { pickChatSuggestions } from '@/lib/chat-suggestions';
import { useChatMutation, type ChatHistoryEntry, type ChatResponse } from '@/lib/chat-queries';
import { useMoodLogs, useTodaysMood } from '@/lib/mood-queries';
import { getDefaultProgress } from '@/lib/progress';
import { useUserProgress } from '@/lib/progress-queries';
import { useProfile } from '@/lib/profile-queries';
import { EMPTY_WAARDEN_DATA } from '@/lib/waarden';
import { useAuth } from '@/providers/AuthProvider';
import { useWaarden } from '@/providers/WaardenProvider';

const CHATBOT_ENABLED = (process.env.EXPO_PUBLIC_ENABLE_CHATBOT ?? 'true') !== 'false';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function resetChatUiState(setters: {
  setMessages: (messages: ChatMessage[]) => void;
  setHydrated: (value: boolean) => void;
  setCrisisActive: (value: boolean) => void;
  setNoMatchSuggestions: (value: string[] | null) => void;
  setErrorText: (value: string | null) => void;
}) {
  setters.setMessages([]);
  setters.setHydrated(true);
  setters.setCrisisActive(false);
  setters.setNoMatchSuggestions(null);
  setters.setErrorText(null);
}

/**
 * /chat — RAG chatbot screen (ADR-005).
 *
 * Messages persist per chat session. The assistant recalls all stored sessions
 * server-side; the UI shows only the active session.
 */
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView | null>(null);
  const composerRef = useRef<ChatComposerHandle | null>(null);
  const loadedSessionRef = useRef<string | null>(null);

  const mutation = useChatMutation();
  const {
    data: sessionId,
    isLoading: sessionLoading,
    isError: sessionError,
    isFetched: sessionFetched,
    refetch: refetchSession,
  } = useActiveChatSession();
  const effectiveSessionId = sessionId ?? loadedSessionRef.current ?? undefined;
  const { data: persistedMessages, isLoading: messagesLoading } =
    useChatMessages(effectiveSessionId);
  const insertMessage = useInsertChatMessage(effectiveSessionId);
  const clearCurrentChat = useClearCurrentChat();
  const { data: profile } = useProfile();
  const { data: progress } = useUserProgress();
  const { data: moodLogs } = useMoodLogs('7d');
  const { data: todaysMood } = useTodaysMood();
  const { data: waardenData } = useWaarden();

  const openingSuggestions = useMemo(
    () =>
      pickChatOpeningSuggestions({
        progress: progress ?? getDefaultProgress(),
        moodLogs: moodLogs ?? [],
        todaysMood: todaysMood ?? null,
        waarden: waardenData ?? EMPTY_WAARDEN_DATA,
      }),
    [progress, moodLogs, todaysMood, waardenData],
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [crisisActive, setCrisisActive] = useState(false);
  const [noMatchSuggestions, setNoMatchSuggestions] = useState<string[] | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: hiddenTabBarStyle });
      return () => {
        navigation.getParent()?.setOptions({
          tabBarStyle: defaultTabBarStyle(insets.bottom),
        });
      };
    }, [navigation, insets.bottom]),
  );

  useEffect(() => {
    if (sessionId) loadedSessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!effectiveSessionId || messagesLoading) return;
    if (loadedSessionRef.current === effectiveSessionId && hydrated) return;
    if (persistedMessages === undefined) return;

    setMessages(
      persistedMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })),
    );
    loadedSessionRef.current = effectiveSessionId;
    setHydrated(true);
  }, [effectiveSessionId, messagesLoading, persistedMessages, hydrated]);

  useEffect(() => {
    if (!CHATBOT_ENABLED) return;
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, mutation.isPending]);

  if (!CHATBOT_ENABLED) {
    return <UnavailableScreen onBack={() => router.replace('/home')} />;
  }

  if ((sessionLoading || messagesLoading) && !hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  const history: ChatHistoryEntry[] = messages.map((m) => ({ role: m.role, content: m.content }));

  function appendUser(content: string) {
    setMessages((prev) => [...prev, { id: makeId(), role: 'user', content }]);
  }

  function appendAssistant(content: string) {
    setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content }]);
  }

  async function persistMessage(role: 'user' | 'assistant', content: string): Promise<boolean> {
    try {
      await insertMessage.mutateAsync({ role, content });
      return true;
    } catch {
      try {
        await insertMessage.mutateAsync({ role, content });
        return true;
      } catch {
        return false;
      }
    }
  }

  async function handleSend(question: string) {
    if (!effectiveSessionId || crisisActive) return;

    setErrorText(null);
    setNoMatchSuggestions(null);
    appendUser(question);

    const historyForRequest: ChatHistoryEntry[] = [...history, { role: 'user', content: question }];

    const userPersisted = await persistMessage('user', question);
    if (!userPersisted) {
      setErrorText(chat.errors.persistFailed);
      return;
    }

    mutation.mutate(
      { question, history: historyForRequest, firstName: profile?.first_name ?? null },
      {
        onSuccess: async (data: ChatResponse) => {
          if (data.crisis) {
            setCrisisActive(true);
            return;
          }
          if (data.noMatch) {
            const answerText = ensureQuestionMarks(data.answer);
            appendAssistant(answerText);
            void persistMessage('assistant', answerText);
            setNoMatchSuggestions(pickChatSuggestions(question));
            return;
          }
          const answerText = ensureQuestionMarks(data.answer);
          appendAssistant(answerText);
          void persistMessage('assistant', answerText);
        },
        onError: (err) => {
          setErrorText(err.message);
        },
      },
    );
  }

  function handleSuggestion(text: string) {
    if (mutation.isPending || crisisActive) return;
    void handleSend(text);
  }

  function afterClear(newSessionId?: string) {
    mutation.reset();
    loadedSessionRef.current = newSessionId ?? null;
    resetChatUiState({
      setMessages,
      setHydrated,
      setCrisisActive,
      setNoMatchSuggestions,
      setErrorText,
    });
  }

  function confirmClearCurrent() {
    if (!effectiveSessionId) return;
    Alert.alert(chat.clear.currentTitle, chat.clear.currentBody, [
      { text: chat.clear.cancel, style: 'cancel' },
      {
        text: chat.clear.currentAction,
        style: 'destructive',
        onPress: () =>
          clearCurrentChat.mutate(effectiveSessionId, {
            onSuccess: async (newSessionId) => {
              loadedSessionRef.current = newSessionId;
              await queryClient.refetchQueries({
                queryKey: ACTIVE_CHAT_SESSION_KEY(user?.id),
              });
              afterClear(newSessionId);
            },
            onError: () => setErrorText(chat.errors.clearFailed),
          }),
      },
    ]);
  }

  const clearing = clearCurrentChat.isPending;
  const composerDisabled =
    mutation.isPending || clearing || (!effectiveSessionId && sessionLoading);
  const canClear = messages.length > 0 || crisisActive || noMatchSuggestions !== null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View
        className="flex-row items-center gap-2 border-b border-border bg-surface px-4 pb-2"
        style={{ paddingTop: insets.top + 4 }}
      >
        <BackButton onPress={() => router.back()} />
        <View className="flex-1">
          <Text className="font-semibold text-text">{chat.title}</Text>
          <Text className="text-xs text-text-subtle">{chat.subtitle}</Text>
        </View>
        {canClear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chat.clearMenuLabel}
            onPress={confirmClearCurrent}
            disabled={clearing}
            className="min-h-[44px] justify-center rounded-lg px-2 active:opacity-70 disabled:opacity-50"
          >
            <Text className="text-sm font-medium text-primary-dark">{chat.clearMenuLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && !crisisActive ? (
          <EmptyState suggestions={openingSuggestions} onPick={handleSuggestion} />
        ) : null}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {mutation.isPending ? <TypingIndicator /> : null}

        {noMatchSuggestions ? (
          <NoMatchCard suggestions={noMatchSuggestions} onPick={handleSuggestion} />
        ) : null}

        {crisisActive ? <CrisisCard /> : null}

        {errorText ? (
          <View className="mb-3 rounded-2xl border border-crisis-border bg-crisis-soft p-3">
            <Text className="text-sm text-crisis-dark">{errorText}</Text>
          </View>
        ) : null}

        {sessionFetched && sessionError && !effectiveSessionId ? (
          <View className="mb-3 rounded-2xl border border-crisis-border bg-crisis-soft p-3">
            <Text className="mb-2 text-sm text-crisis-dark">{chat.errors.sessionFailed}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Opnieuw proberen"
              onPress={() => void refetchSession()}
              className="self-start rounded-lg bg-primary px-3 py-2 active:bg-primary-dark"
            >
              <Text className="text-sm font-medium text-white">Opnieuw proberen</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
        <ChatComposer
          ref={composerRef}
          disabled={composerDisabled}
          onSend={handleSend}
          footerNote={chat.disclaimer}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function EmptyState({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (q: string) => void;
}) {
  return (
    <View className="py-6">
      <Text className="mb-2 text-lg font-semibold text-text">{chat.emptyState.title}</Text>
      <Text className="mb-5 text-sm text-text-subtle">{chat.emptyState.subtitle}</Text>
      <View className="gap-2">
        {suggestions.map((q) => (
          <Pressable
            key={q}
            accessibilityRole="button"
            accessibilityLabel={q}
            onPress={() => onPick(q)}
            className="rounded-2xl border border-primary-border-soft bg-surface px-4 py-3 active:bg-primary-soft"
          >
            <Text className="text-base text-primary-dark">{q}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function UnavailableScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <BackButton onPress={onBack} />
      <View className="mt-12 items-center">
        <Text className="mb-3 text-center font-serif text-2xl font-bold text-text">
          {chat.unavailable.title}
        </Text>
        <Text className="mb-8 text-center text-base text-text-subtle">{chat.unavailable.body}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Terug naar startscherm"
          onPress={onBack}
          className="rounded-2xl bg-primary px-6 py-3 active:bg-primary-dark"
        >
          <Text className="font-medium text-white">Terug</Text>
        </Pressable>
      </View>
    </View>
  );
}
