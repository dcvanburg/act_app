import { useMutation } from '@tanstack/react-query';

import chat from '@/content/nl/chat.json';
import { containsCrisisSignal } from '@/lib/chat-safety';
import { supabase } from '@/lib/supabase/client';

/**
 * TanStack Query mutation for the RAG chatbot search Edge Function.
 *
 * Pipeline:
 *   1. Local crisis pre-filter (chat-safety.ts) — bypasses the network call
 *      entirely on a match. Returns a synthetic ChatResponse marked
 *      `crisis: true` carrying the Dutch deflection from chat.json.
 *   2. supabase.functions.invoke('search') with the user's question and the
 *      last 3 turns of history (server caps history at 6 entries too).
 *   3. Map Supabase errors to Dutch error keys from chat.json.errors.
 *
 * History is held by the caller in component state and passed in on each
 * call. Nothing is persisted client-side; the in-memory chat dies with
 * the screen (ADR-005 / SECURITY.md → AI processing).
 */

export type ChatRole = 'user' | 'assistant';

export interface ChatHistoryEntry {
  role: ChatRole;
  content: string;
}

export interface ChatResponse {
  answer: string;
  chunksFound: number;
  crisis?: boolean;
}

export interface ChatMutationArgs {
  question: string;
  history: ChatHistoryEntry[];
}

const HISTORY_WINDOW = 6;

function localCrisisResponse(): ChatResponse {
  return {
    answer: chat.crisisDeflection.body,
    chunksFound: 0,
    crisis: true,
  };
}

function mapErrorMessage(rawMessage: string | null | undefined): string {
  const msg = (rawMessage ?? '').toLowerCase();
  if (msg.includes('niet ingelogd') || msg.includes('unauthorized')) {
    return chat.errors.unauthorized;
  }
  if (msg.includes('te lang')) return chat.errors.tooLong;
  if (msg.includes('verplicht') || msg.includes('ongeldig')) return chat.errors.empty;
  if (msg.includes('429') || msg.includes('rate')) return chat.errors.rateLimited;
  if (msg.includes('network') || msg.includes('fetch')) return chat.errors.offline;
  return chat.errors.generic;
}

async function callSearchFunction(args: ChatMutationArgs): Promise<ChatResponse> {
  const history = args.history.slice(-HISTORY_WINDOW);

  const { data, error } = await supabase.functions.invoke<ChatResponse & { error?: string }>(
    'search',
    {
      body: {
        question: args.question,
        history,
      },
    },
  );

  if (error) {
    throw new Error(mapErrorMessage(error.message));
  }
  if (!data || typeof data.answer !== 'string') {
    throw new Error(chat.errors.generic);
  }
  if ('error' in data && data.error) {
    throw new Error(mapErrorMessage(data.error));
  }

  return {
    answer: data.answer,
    chunksFound: data.chunksFound ?? 0,
    crisis: data.crisis === true,
  };
}

export function useChatMutation() {
  return useMutation<ChatResponse, Error, ChatMutationArgs>({
    mutationFn: async (args: ChatMutationArgs): Promise<ChatResponse> => {
      const question = args.question.trim();
      if (!question) {
        throw new Error(chat.errors.empty);
      }

      if (containsCrisisSignal(question)) {
        return localCrisisResponse();
      }

      return callSearchFunction({ question, history: args.history });
    },
  });
}
