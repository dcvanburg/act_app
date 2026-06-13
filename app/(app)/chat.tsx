import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { ChatComposer, type ChatComposerHandle } from '@/components/chat/ChatComposer';
import { CrisisCard } from '@/components/chat/CrisisCard';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ClarifyCard } from '@/components/chat/ClarifyCard';
import { NoMatchCard } from '@/components/chat/NoMatchCard';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import chat from '@/content/nl/chat.json';
import { pickChatSuggestions } from '@/lib/chat-suggestions';
import { useChatMutation, type ChatHistoryEntry, type ChatResponse } from '@/lib/chat-queries';

const CHATBOT_ENABLED = (process.env.EXPO_PUBLIC_ENABLE_CHATBOT ?? 'true') !== 'false';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * /chat — RAG chatbot screen (ADR-005, Phase 3).
 *
 * Conversation lives in component state only. On unmount everything is gone:
 * no persistence client-side, no message body retained server-side. The
 * server-side `chat_sessions` table holds a counter only.
 *
 * The local crisis pre-filter inside useChatMutation never reaches the
 * Edge Function on a match; the CrisisCard renders inline.
 */
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mutation = useChatMutation();
  const scrollRef = useRef<ScrollView | null>(null);
  const composerRef = useRef<ChatComposerHandle | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [crisisActive, setCrisisActive] = useState(false);
  const [noMatchSuggestions, setNoMatchSuggestions] = useState<string[] | null>(null);
  const [clarifyOptions, setClarifyOptions] = useState<string[] | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!CHATBOT_ENABLED) return;
    // Scroll to bottom when messages change.
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, mutation.isPending]);

  if (!CHATBOT_ENABLED) {
    return <UnavailableScreen onBack={() => router.replace('/home')} />;
  }

  const history: ChatHistoryEntry[] = messages.map((m) => ({ role: m.role, content: m.content }));

  function appendUser(content: string) {
    setMessages((prev) => [...prev, { id: makeId(), role: 'user', content }]);
  }

  function appendAssistant(content: string) {
    setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content }]);
  }

  function handleSend(question: string) {
    setErrorText(null);
    setNoMatchSuggestions(null);
    setClarifyOptions(null);
    appendUser(question);

    mutation.mutate(
      { question, history },
      {
        onSuccess: (data: ChatResponse) => {
          if (data.crisis) {
            setCrisisActive(true);
            return;
          }
          if (data.noMatch) {
            setNoMatchSuggestions(pickChatSuggestions(question));
            return;
          }
          if (data.clarify) {
            appendAssistant(data.answer);
            setClarifyOptions(data.clarifyOptions ?? pickChatSuggestions(question));
            return;
          }
          appendAssistant(data.answer);
        },
        onError: (err) => {
          setErrorText(err.message);
        },
      },
    );
  }

  function handleSuggestion(text: string) {
    if (mutation.isPending || crisisActive) return;
    handleSend(text);
  }

  function handleTypeOwnQuestion() {
    if (mutation.isPending || crisisActive) return;
    requestAnimationFrame(() => composerRef.current?.focus());
  }

  function handleClearConversation() {
    mutation.reset();
    setMessages([]);
    setCrisisActive(false);
    setNoMatchSuggestions(null);
    setClarifyOptions(null);
    setErrorText(null);
  }

  const composerDisabled = mutation.isPending || crisisActive;
  const canClear =
    messages.length > 0 ||
    crisisActive ||
    noMatchSuggestions !== null ||
    clarifyOptions !== null ||
    errorText !== null ||
    mutation.isPending;

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
            accessibilityLabel={chat.clearConversation}
            onPress={handleClearConversation}
            className="min-h-[44px] justify-center rounded-lg px-2 active:opacity-70"
          >
            <Text className="text-sm font-medium text-primary-dark">{chat.clearConversation}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && !crisisActive ? <EmptyState onPick={handleSuggestion} /> : null}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {mutation.isPending ? <TypingIndicator /> : null}

        {clarifyOptions ? (
          <ClarifyCard
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

      <View
        className="bg-surface"
        style={{
          // Leave 64pt below the composer for the floating Noodknop so it
          // never covers the Send button.
          paddingBottom: (insets.bottom > 0 ? insets.bottom : 8) + 64,
        }}
      >
        <Text className="px-4 pt-2 text-xs text-text-muted">{chat.disclaimer}</Text>
        <ChatComposer ref={composerRef} disabled={composerDisabled} onSend={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <View className="py-6">
      <Text className="mb-2 text-lg font-semibold text-text">{chat.emptyState.title}</Text>
      <Text className="mb-5 text-sm text-text-subtle">{chat.emptyState.subtitle}</Text>
      <View className="gap-2">
        {chat.suggestedQuestions.map((q) => (
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
