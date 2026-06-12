import { describe, expect, it } from 'vitest';

import { __CRISIS_KEYWORDS, containsCrisisSignal } from '@/lib/chat-safety';

describe('containsCrisisSignal', () => {
  it('matches all approved hard-trigger keywords on a word boundary', () => {
    for (const kw of __CRISIS_KEYWORDS) {
      const sentence = `Ik denk vaak aan ${kw} de laatste tijd.`;
      expect(containsCrisisSignal(sentence)).toBe(true);
    }
  });

  it('matches case-insensitively', () => {
    expect(containsCrisisSignal('ZELFMOORD')).toBe(true);
    expect(containsCrisisSignal('Suïcide')).toBe(true);
  });

  it('matches phrases with surrounding punctuation', () => {
    expect(containsCrisisSignal('Ik wil dood, echt waar.')).toBe(true);
    expect(containsCrisisSignal('"einde maken" zeggen ze.')).toBe(true);
    expect(containsCrisisSignal('Ik kan niet meer!')).toBe(true);
  });

  it('does not false-positive on benign Dutch text', () => {
    expect(containsCrisisSignal('Ik ga dood van het lachen om die mop.')).toBe(false);
    expect(containsCrisisSignal('Wat is acceptatie in dit programma?')).toBe(false);
    expect(containsCrisisSignal('Welke oefening helpt bij spanning?')).toBe(false);
    expect(containsCrisisSignal('Ik ben moedeloos maar het lukt.')).toBe(false);
  });

  it('does not match crisis substrings inside other Dutch words', () => {
    // "dood" alone inside "doodmoe" must not trigger — multi-word phrases
    // catch the actual ambiguous cases.
    expect(containsCrisisSignal('Ik ben doodmoe na een lange dag.')).toBe(false);
    expect(containsCrisisSignal('De voordeur klemt.')).toBe(false);
  });

  it('returns false for empty or whitespace-only input', () => {
    expect(containsCrisisSignal('')).toBe(false);
    expect(containsCrisisSignal('   ')).toBe(false);
  });

  it('matches a known crisis phrase in mid-sentence position', () => {
    expect(
      containsCrisisSignal(
        'Sinds een week heb ik gedachten dat ik mezelf iets aandoen zou kunnen, dat is heftig.',
      ),
    ).toBe(true);
  });
});
