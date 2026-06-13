import { describe, expect, it } from 'vitest';

import { ensureQuestionMarks, needsQuestionMark } from '@/lib/chat-punctuation';

describe('ensureQuestionMarks', () => {
  it('adds a question mark to interrogative sentences', () => {
    expect(ensureQuestionMarks('Bedoel je acceptatie of defusie.')).toBe(
      'Bedoel je acceptatie of defusie?',
    );
    expect(ensureQuestionMarks('Waar gaat je vraag over')).toBe('Waar gaat je vraag over?');
    expect(ensureQuestionMarks('Wil je het over stemming of waarden hebben:')).toBe(
      'Wil je het over stemming of waarden hebben?',
    );
  });

  it('leaves statements unchanged', () => {
    expect(ensureQuestionMarks('Acceptatie is ruimte maken voor wat er is.')).toBe(
      'Acceptatie is ruimte maken voor wat er is.',
    );
    expect(ensureQuestionMarks('Kies een van deze onderwerpen.')).toBe(
      'Kies een van deze onderwerpen.',
    );
  });

  it('fixes only the final question in multi-sentence replies', () => {
    expect(
      ensureQuestionMarks('Dat kan bij meerdere onderwerpen horen. Bedoel je acceptatie.'),
    ).toBe('Dat kan bij meerdere onderwerpen horen. Bedoel je acceptatie?');
  });

  it('does not double a question mark', () => {
    expect(ensureQuestionMarks('Wat is defusie?')).toBe('Wat is defusie?');
  });
});

describe('needsQuestionMark', () => {
  it('detects missing question marks', () => {
    expect(needsQuestionMark('Bedoel je acceptatie.')).toBe(true);
    expect(needsQuestionMark('Acceptatie is ruimte maken.')).toBe(false);
  });
});
