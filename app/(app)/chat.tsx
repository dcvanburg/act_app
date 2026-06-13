import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { ClarifyCard } from '@/components/chat/ClarifyCard';
import { NoMatchCard } from '@/components/chat/NoMatchCard';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import chat from '@/content/nl/chat.json';
import { stripClarifyBulletOptions } from '@/lib/chat-greeting';
import {
  useActiveChatSession,
  useChatHistoryStats,
  useChatMessages,
  useClearAllChatHistory,
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
  setClarifyPrompt: (value: string | null) => void;
  setClarifyOptions: (value: string[] | null) => void;
  setErrorText: (value: string | null) => void;
}) {
  setters.setMessages([]);
  setters.setHydrated(true);
  setters.setCrisisActive(false);
  setters.setNoMatchSuggestions(null);
  setters.setClarifyPrompt(null);
  setters.setClarifyOptions(null);
  setters.setErrorText(null);
}

/**
 * /chat — RAG chatbot screen (ADR-005).
 *
 * Messages persist per chat session. The gids recalls all stored sessions
 * server-side; the UI shows only the active session.
 */
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mutation = useChatMutation();
  const { data: sessionId, isLoading: sessionLoading } = useActiveChatSession();
  const { data: historyStats } = useChatHistoryStats();
  const { data: persistedMessages, isLoading: messagesLoading } = useChatMessages(sessionId);
  const insertMessage = useInsertChatMessage(sessionId);
  const clearCurrentChat = useClearCurrentChat();
  const clearAllHistory = useClearAllChatHistory();
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
  const scrollRef = useRef<ScrollView | null>(null);
  const composerRef = useRef<ChatComposerHandle | null>(null);
  const loadedSessionRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [crisisActive, setCrisisActive] = useState(false);
  const [noMatchSuggestions, setNoMatchSuggestions] = useState<string[] | null>(null);
  const [clarifyPrompt, setClarifyPrompt] = useState<string | null>(null);
  const [clarifyOptions, setClarifyOptions] = useState<string[] | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || messagesLoading) return;
    if (loadedSessionRef.current === sessionId && hydrated) return;
    if (!persistedMessages) return;

    setMessages(
      persistedMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })),
    );
    loadedSessionRef.current = sessionId;
    setHydrated(true);
  }, [sessionId, messagesLoading, persistedMessages, hydrated]);

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

  async function persistMessage(role: 'user' | 'assistant', content: string) {
    await insertMessage.mutateAsync({ role, content });
  }

  async function handleSend(question: string) {
    if (!sessionId) return;

    setErrorText(null);
    setNoMatchSuggestions(null);
    setClarifyPrompt(null);
    setClarifyOptions(null);
    appendUser(question);

    try {
      await persistMessage('user', question);
    } catch {
      setErrorText(chat.errors.generic);
      return;
    }

    mutation.mutate(
      { question, history, firstName: profile?.first_name ?? null },
      {
        onSuccess: async (data: ChatResponse) => {
          if (data.crisis) {
            setCrisisActive(true);
            return;
          }
          if (data.noMatch) {
            setNoMatchSuggestions(pickChatSuggestions(question));
            return;
          }
          if (data.clarify) {
            setClarifyPrompt(stripClarifyBulletOptions(data.answer));
            setClarifyOptions(data.clarifyOptions ?? pickChatSuggestions(question));
            return;
          }
          appendAssistant(data.answer);
          try {
            await persistMessage('assistant', data.answer);
          } catch {
            setErrorText(chat.errors.generic);
          }
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

  function handleTypeOwnQuestion() {
    if (mutation.isPending || crisisActive) return;
    requestAnimationFrame(() => composerRef.current?.focus());
  }

  function afterClear() {
    mutation.reset();
    loadedSessionRef.current = null;
    setHydrated(false);
    resetChatUiState({
      setMessages,
      setHydrated,
      setCrisisActive,
      setNoMatchSuggestions,
      setClarifyPrompt,
      setClarifyOptions,
      setErrorText,
    });
  }

  function confirmClearCurrent() {
    if (!sessionId) return;
    Alert.alert(chat.clear.currentTitle, chat.clear.currentBody, [
      { text: chat.clear.cancel, style: 'cancel' },
      {
        text: chat.clear.currentAction,
        style: 'destructive',
        onPress: () =>
          clearCurrentChat.mutate(sessionId, {
            onSuccess: afterClear,
            onError: () => setErrorText(chat.errors.generic),
          }),
      },
    ]);
  }

  function confirmClearAll() {
    Alert.alert(chat.clear.allTitle, chat.clear.allBody, [
      { text: chat.clear.cancel, style: 'cancel' },
      {
        text: chat.clear.allAction,
        style: 'destructive',
        onPress: () =>
          clearAllHistory.mutate(undefined, {
            onSuccess: afterClear,
            onError: () => setErrorText(chat.errors.generic),
          }),
      },
    ]);
  }

  function openClearMenu() {
    const canClearCurrent =
      messages.length > 0 || crisisActive || noMatchSuggestions !== null || clarifyPrompt !== null;
    const canClearAll =
      (historyStats?.totalMessages ?? 0) > 0 || (historyStats?.endedSessions ?? 0) > 0;

    if (!canClearCurrent && !canClearAll) return;

    const options: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }> = [{ text: chat.clear.cancel, style: 'cancel' }];

    if (canClearCurrent) {
      options.unshift({
        text: chat.clear.currentOption,
        onPress: confirmClearCurrent,
      });
    }

    if (canClearAll) {
      options.unshift({
        text: chat.clear.allOption,
        style: 'destructive',
        onPress: confirmClearAll,
      });
    }

    Alert.alert(chat.clear.menuTitle, undefined, options);
  }

  const clearing = clearCurrentChat.isPending || clearAllHistory.isPending;
  const composerDisabled = mutation.isPending || crisisActive || clearing || !sessionId;
  const canOpenClearMenu =
    messages.length > 0 ||
    crisisActive ||
    noMatchSuggestions !== null ||
    clarifyPrompt !== null ||
    clarifyOptions !== null ||
    (historyStats?.totalMessages ?? 0) > 0 ||
    (historyStats?.endedSessions ?? 0) > 0;

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
        {canOpenClearMenu ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chat.clearMenuLabel}
            onPress={openClearMenu}
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

        {clarifyPrompt && clarifyOptions ? (
          <ClarifyCard
            prompt={clarifyPrompt}
            options={clarifyOptions}
            onPick={handleSuggestion}
            onTypeOwn={handleTypeOwnQuestion}
          />
        ) : null}

        {noMatchSuggestions ? (
          <NoMatchCard suggestions={noMatchSuggestions} onPick={handleSuggestion} />
        ) : null}

        {crisisActive ? <CrisisCard /> : null}

        {errorText ? (
          <View className="mb-3 rounded-2xl border border-crisis-border bg-crisis-soft p-3">
            <Text className="text-sm text-crisis-dark">{errorText}</Text>
          </View>
        ) : null}
      </ScrollView>

      <ChatComposer
        ref={composerRef}
        disabled={composerDisabled}
        onSend={handleSend}
        footerNote={chat.disclaimer}
      />
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
