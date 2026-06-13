/** Matches public.chat_messages.content check constraint. */
export const MAX_CHAT_MESSAGE_LENGTH = 4000;

/** Truncate before DB insert so persistence never fails on length. */
export function truncateChatMessage(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= MAX_CHAT_MESSAGE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_CHAT_MESSAGE_LENGTH - 1)}…`;
}
