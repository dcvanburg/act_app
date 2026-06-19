/**
 * Stored chat message helpers for the search Edge Function.
 * Mirrors src/lib/chat-conversation-context.ts — keep in sync.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

export type StoredChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export const MAX_LLM_TURN_MESSAGES = 6;
export const MAX_MEMORY_MESSAGES = 40;
const MAX_MEMORY_ENTRY_LENGTH = 250;
const MAX_FETCH_MESSAGES = 200;

function truncateEntry(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_MEMORY_ENTRY_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_MEMORY_ENTRY_LENGTH)}…`;
}

export function formatConversationMemory(
  messages: StoredChatMessage[],
  recentCount = MAX_LLM_TURN_MESSAGES,
): string {
  if (messages.length <= recentCount) return '';

  const older = messages.slice(0, -recentCount).slice(-MAX_MEMORY_MESSAGES);
  if (older.length === 0) return '';

  const lines = older.map((m) => {
    const label = m.role === 'user' ? 'Gebruiker' : 'Assistent';
    return `• ${label}: «${truncateEntry(m.content)}»`;
  });

  return `Eerdere gesprekken met de assistent:\n${lines.join('\n')}`;
}

export function recentTurnMessages(
  messages: StoredChatMessage[],
  recentCount = MAX_LLM_TURN_MESSAGES,
): StoredChatMessage[] {
  return messages.slice(-recentCount);
}

export async function fetchStoredChatMessages(
  supabase: SupabaseClient,
  userId: string,
): Promise<StoredChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(MAX_FETCH_MESSAGES);

  if (error) throw new Error(`chat_messages: ${error.message}`);

  return (data ?? [])
    .filter(
      (row): row is { role: 'user' | 'assistant'; content: string; created_at: string } =>
        (row.role === 'user' || row.role === 'assistant') && typeof row.content === 'string',
    )
    .map((row) => ({ role: row.role, content: row.content }));
}
