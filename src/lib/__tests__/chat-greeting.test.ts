import { describe, expect, it } from 'vitest';

import {
  formatGreetingOnlyReply,
  formatGreetingPrefix,
  isGreetingOnly,
  prependFirstTurnGreeting,
  stripClarifyBulletOptions,
  stripGreetingPrefix,
} from '@/lib/chat-greeting';

describe('isGreetingOnly', () => {
  it('detects pure greetings', () => {
    expect(isGreetingOnly('Hoi')).toBe(true);
    expect(isGreetingOnly('Hallo!')).toBe(true);
    expect(isGreetingOnly('Goedemorgen')).toBe(true);
    expect(isGreetingOnly('Hey daar')).toBe(true);
  });

  it('rejects greetings with a question', () => {
    expect(isGreetingOnly('Hoi, wat is acceptatie?')).toBe(false);
    expect(isGreetingOnly('Hallo, hoe werkt de bodyscan?')).toBe(false);
  });
});

describe('stripGreetingPrefix', () => {
  it('removes a leading greeting before retrieval', () => {
    expect(stripGreetingPrefix('Hoi, wat is acceptatie?')).toBe('wat is acceptatie?');
    expect(stripGreetingPrefix('Goedemorgen! Wat is defusie?')).toBe('Wat is defusie?');
  });
});

describe('formatGreetingOnlyReply', () => {
  it('uses the first name when available', () => {
    expect(formatGreetingOnlyReply('Dennis')).toBe('Hoi Dennis, fijn dat je er bent.');
  });

  it('falls back without a name', () => {
    expect(formatGreetingOnlyReply(null)).toBe('Hoi, fijn dat je er bent.');
  });
});

describe('prependFirstTurnGreeting', () => {
  it('prepends a personal greeting to the first answer', () => {
    expect(prependFirstTurnGreeting('Acceptatie is ruimte maken.', 'Dennis')).toBe(
      'Hoi Dennis, Acceptatie is ruimte maken.',
    );
  });

  it('does not double-greet', () => {
    expect(prependFirstTurnGreeting('Hoi Dennis, alles goed.', 'Dennis')).toBe(
      'Hoi Dennis, alles goed.',
    );
  });
});

describe('formatGreetingPrefix', () => {
  it('builds a name prefix', () => {
    expect(formatGreetingPrefix('Dennis')).toBe('Hoi Dennis, ');
  });
});

describe('stripClarifyBulletOptions', () => {
  it('removes bullet lines from clarify prompts', () => {
    const input = 'Bedoel je een van deze?\n• Acceptatie\n• Defusie';
    expect(stripClarifyBulletOptions(input)).toBe('Bedoel je een van deze?');
  });
});
