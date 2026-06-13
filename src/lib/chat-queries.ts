import { useMutation } from '@tanstack/react-query';

import chat from '@/content/nl/chat.json';
import { formatGreetingOnlyReply, isGreetingOnly } from '@/lib/chat-greeting';
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
 *      last 3 turns of history (server caps history at 6 entries too). The
 *      Edge Function loads mood/waarden profile data server-side (JWT+RLS);
 *      nothing personal is sent from the client.
 *   3. Map Supabase errors to Dutch error keys from chat.json.errors.
 *
 * History is held by the caller in component state and passed in on each
 * call. Messages persist in `chat_messages` (Supabase, RLS); the Edge
 * Function loads stored history for LLM memory (ADR-005).
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
  /** True when hybrid_search returned zero chunks — client shows suggestion chips. */
  noMatch?: boolean;
  /** True when intent is unclear — client shows clarify chips after assistant bubble. */
  clarify?: boolean;
  clarifyOptions?: string[];
}

export interface ChatMutationArgs {
  question: string;
  history: ChatHistoryEntry[];
  /** Profile first name — used for first-turn greetings (client-side fast path). */
  firstName?: string | null;
}

const HISTORY_WINDOW = 6;

function localCrisisResponse(): ChatResponse {
  return {
    answer: chat.crisisDeflection.body,
    chunksFound: 0,
    crisis: true,
  };
}

function localGreetingResponse(firstName: string | null | undefined): ChatResponse {
  return {
    answer: formatGreetingOnlyReply(firstName ?? null),
    chunksFound: 0,
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
    noMatch: data.noMatch === true,
    clarify: data.clarify === true,
    clarifyOptions: Array.isArray(data.clarifyOptions) ? data.clarifyOptions : undefined,
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

      if (args.history.length === 0 && isGreetingOnly(question)) {
        return localGreetingResponse(args.firstName);
      }

      return callSearchFunction({
        question,
        history: args.history,
        firstName: args.firstName,
      });
    },
  });
}
