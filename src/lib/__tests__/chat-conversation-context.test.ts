import { describe, expect, it } from 'vitest';

import {
  formatConversationMemory,
  recentTurnMessages,
  type StoredChatMessage,
} from '@/lib/chat-conversation-context';

function msgs(pairs: Array<[StoredChatMessage['role'], string]>): StoredChatMessage[] {
  return pairs.map(([role, content]) => ({ role, content }));
}

describe('formatConversationMemory', () => {
  it('returns empty when there are only recent turns', () => {
    const messages = msgs([
      ['user', 'Eerste vraag'],
      ['assistant', 'Eerste antwoord'],
      ['user', 'Tweede vraag'],
      ['assistant', 'Tweede antwoord'],
    ]);
    expect(formatConversationMemory(messages, 4)).toBe('');
  });

  it('summarizes older turns beyond the live window', () => {
    const messages = msgs([
      ['user', 'Ik ben moe'],
      ['assistant', 'Dat kan ik begrijpen'],
      ['user', 'Wat is acceptatie?'],
      ['assistant', 'Acceptatie is…'],
      ['user', 'En defusie?'],
      ['assistant', 'Defusie is…'],
      ['user', 'Nog een vraag'],
      ['assistant', 'Antwoord'],
    ]);
    const text = formatConversationMemory(messages, 4);
    expect(text).toContain('Eerdere gesprekken met de gids');
    expect(text).toContain('Ik ben moe');
    expect(text).not.toContain('Nog een vraag');
  });

  it('truncates very long entries', () => {
    const long = 'a'.repeat(400);
    const text = formatConversationMemory(
      msgs([
        ['user', long],
        ['assistant', 'Kort antwoord'],
      ]),
      1,
    );
    expect(text).toContain('…');
    expect(text.length).toBeLessThan(long.length);
  });
});

describe('recentTurnMessages', () => {
  it('returns the last N messages', () => {
    const messages = msgs([
      ['user', '1'],
      ['assistant', '2'],
      ['user', '3'],
      ['assistant', '4'],
    ]);
    expect(recentTurnMessages(messages, 2)).toEqual([
      { role: 'user', content: '3' },
      { role: 'assistant', content: '4' },
    ]);
  });
});
