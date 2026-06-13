import { describe, expect, it } from 'vitest';

import { MAX_CHAT_MESSAGE_LENGTH, truncateChatMessage } from '@/lib/chat-message-limits';

describe('truncateChatMessage', () => {
  it('leaves short messages unchanged', () => {
    expect(truncateChatMessage('Hallo')).toBe('Hallo');
  });

  it('truncates messages beyond the DB limit', () => {
    const long = 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH + 50);
    const result = truncateChatMessage(long);
    expect(result.length).toBe(MAX_CHAT_MESSAGE_LENGTH);
    expect(result.endsWith('…')).toBe(true);
  });
});
