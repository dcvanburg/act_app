/**
 * Formats stored chat messages for the RAG system prompt.
 * Mirrors supabase/functions/search/conversation-context.ts — keep in sync.
 */

export type StoredChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export const MAX_LLM_TURN_MESSAGES = 6;
export const MAX_MEMORY_MESSAGES = 40;
const MAX_MEMORY_ENTRY_LENGTH = 250;

function truncateEntry(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_MEMORY_ENTRY_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_MEMORY_ENTRY_LENGTH)}…`;
}

/**
 * Dutch summary of older turns (before the live LLM window).
 * Omits the most recent `recentCount` messages — those go in the messages array.
 */
export function formatConversationMemory(
  messages: StoredChatMessage[],
  recentCount = MAX_LLM_TURN_MESSAGES,
): string {
  if (messages.length <= recentCount) return '';

  const older = messages.slice(0, -recentCount).slice(-MAX_MEMORY_MESSAGES);
  if (older.length === 0) return '';

  const lines = older.map((m) => {
    const label = m.role === 'user' ? 'Gebruiker' : 'Gids';
    return `• ${label}: «${truncateEntry(m.content)}»`;
  });

  return `Eerdere gesprekken met de gids:\n${lines.join('\n')}`;
}

/** Recent turns sent as Claude message history. */
export function recentTurnMessages(
  messages: StoredChatMessage[],
  recentCount = MAX_LLM_TURN_MESSAGES,
): StoredChatMessage[] {
  return messages.slice(-recentCount);
}
