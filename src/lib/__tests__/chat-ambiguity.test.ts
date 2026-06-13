import { describe, expect, it } from 'vitest';

import {
  assessClarifyNeed,
  buildClarifyOptions,
  buildTopRetrievalOptions,
  isAmbiguousRetrieval,
  isClarifyFollowUp,
  isValidClarifyOption,
  isVagueQuestion,
  sanitizeClarifyOptions,
  uncertaintyStreak,
  type RetrievalChunk,
} from '@/lib/chat-ambiguity';
import type { ChatUserContextData } from '@/lib/chat-user-context';

const emptyProfile: ChatUserContextData = {
  complaintTypes: [],
  moodLogs: [],
  waarden: [],
  acties: [],
  barriers: [],
  checkins: [],
  moduleNotes: [],
};

const profileWithMood: ChatUserContextData = {
  ...emptyProfile,
  moodLogs: [{ date: '2026-06-12', mood_score: 3, emotion_tags: ['stress'], note: null }],
};

describe('isVagueQuestion', () => {
  it('flags very short non-topic questions', () => {
    expect(isVagueQuestion('help', [])).toBe(true);
    expect(isVagueQuestion('ik voel me raar', [])).toBe(true);
  });

  it('flags uncertainty phrases', () => {
    expect(isVagueQuestion('ik weet het niet', [])).toBe(true);
    expect(isVagueQuestion('ik weet het echt niet', [])).toBe(true);
  });

  it('allows specific program questions', () => {
    expect(isVagueQuestion('Wat betekent acceptatie in dit programma?', [])).toBe(false);
    expect(isVagueQuestion('Hoe was mijn stemming?', [])).toBe(false);
  });
});

describe('isAmbiguousRetrieval', () => {
  it('detects close scores from different modules', () => {
    const chunks: RetrievalChunk[] = [
      { metadata: { moduleId: 'acceptance' }, rrf_score: 0.02 },
      { metadata: { moduleId: 'defusion' }, rrf_score: 0.018 },
    ];
    expect(isAmbiguousRetrieval(chunks)).toBe(true);
  });

  it('does not flag when top chunk clearly wins', () => {
    const chunks: RetrievalChunk[] = [
      { metadata: { moduleId: 'acceptance', sectionTitle: 'Acceptatie' }, rrf_score: 0.05 },
      { metadata: { moduleId: 'defusion' }, rrf_score: 0.02 },
    ];
    expect(isAmbiguousRetrieval(chunks)).toBe(false);
  });
});

describe('buildTopRetrievalOptions', () => {
  it('returns three distinct clickable questions from top chunks', () => {
    const chunks: RetrievalChunk[] = [
      {
        metadata: { moduleId: 'acceptance', sectionTitle: 'Acceptatie is niet opgeven' },
        rrf_score: 0.03,
      },
      {
        metadata: { moduleId: 'recognition', sectionTitle: 'De vermijdingscirkel' },
        rrf_score: 0.028,
      },
      {
        metadata: { moduleId: 'defusion', sectionTitle: 'Wat is defusie' },
        rrf_score: 0.025,
      },
    ];
    const options = buildTopRetrievalOptions(chunks);
    expect(options).toHaveLength(3);
    expect(options[0]).toContain('acceptatie');
    expect(options[1]).toContain('vermijdingscirkel');
  });
});

describe('assessClarifyNeed', () => {
  it('returns clarify for vague questions without strong retrieval', () => {
    const decision = assessClarifyNeed('help', [], profileWithMood, []);
    expect(decision?.reason).toBe('vague_question');
    expect(decision?.options.length).toBe(3);
  });

  it('returns null for specific questions even with close cross-module chunks', () => {
    const chunks: RetrievalChunk[] = [
      { metadata: { moduleId: 'acceptance', sectionTitle: 'Acceptatie' }, rrf_score: 0.03 },
      { metadata: { moduleId: 'defusion', sectionTitle: 'Defusie' }, rrf_score: 0.029 },
    ];
    const decision = assessClarifyNeed(
      'Wat betekent acceptatie in dit programma?',
      chunks,
      emptyProfile,
      [],
    );
    expect(decision).toBeNull();
  });

  it('returns ambiguous clarify with three retrieval options only for vague input', () => {
    const chunks: RetrievalChunk[] = [
      {
        metadata: { moduleId: 'acceptance', sectionTitle: 'Acceptatie is niet opgeven' },
        rrf_score: 0.02,
      },
      {
        metadata: { moduleId: 'recognition', sectionTitle: 'De vermijdingscirkel' },
        rrf_score: 0.019,
      },
    ];
    const decision = assessClarifyNeed('hm', chunks, emptyProfile, []);
    expect(decision?.reason).toBe('ambiguous_retrieval');
    expect(decision?.options).toHaveLength(3);
  });
});

describe('uncertaintyStreak', () => {
  it('counts repeated vague user turns', () => {
    const history = [
      { role: 'assistant' as const, content: 'Kies een optie.' },
      { role: 'user' as const, content: 'ik weet het niet' },
      { role: 'assistant' as const, content: 'Kies een optie.' },
      { role: 'user' as const, content: 'ik weet het niet' },
    ];
    expect(uncertaintyStreak('ik weet het echt niet', history)).toBe(3);
  });
});

describe('buildClarifyOptions', () => {
  it('includes profile options when mood data exists', () => {
    const options = buildClarifyOptions('hm', [], profileWithMood);
    expect(options.some((o) => o.includes('stemming'))).toBe(true);
  });
});

describe('isValidClarifyOption', () => {
  it('rejects uncertainty phrases offered as chips', () => {
    expect(isValidClarifyOption('ik weet het niet')).toBe(false);
    expect(isValidClarifyOption('ik weet het echt niet')).toBe(false);
    expect(isValidClarifyOption('geen idee')).toBe(false);
  });

  it('allows concrete program questions', () => {
    expect(isValidClarifyOption('Wat is de vermijdingscirkel?')).toBe(true);
    expect(isValidClarifyOption('Iets over mijn stemming of check-in')).toBe(true);
  });
});

describe('sanitizeClarifyOptions', () => {
  it('replaces invalid LLM options with program fallbacks', () => {
    const options = sanitizeClarifyOptions(
      ['ik weet het niet', 'ik weet het echt niet', 'geen idee'],
      'help',
      [],
      emptyProfile,
    );
    expect(options).toHaveLength(3);
    expect(options.every((o) => isValidClarifyOption(o))).toBe(true);
    expect(options.some((o) => o.includes('acceptatie'))).toBe(true);
  });
});

describe('isClarifyFollowUp', () => {
  it('detects vague chip click after a clarify prompt', () => {
    const history = [
      {
        role: 'assistant' as const,
        content:
          'Ik wil je goed helpen, maar ik weet nog niet precies wat je bedoelt. Kies hieronder wat het dichtst in de buurt komt, of typ je vraag specifieker.',
      },
    ];
    expect(isClarifyFollowUp('ik weet het niet', history)).toBe(true);
  });

  it('does not flag vague replies after a full answer', () => {
    const history = [
      {
        role: 'assistant' as const,
        content:
          'Acceptatie in dit programma betekent dat je leert omgaan met wat er is, zonder te vechten of te vermijden. Het is geen opgeven.',
      },
    ];
    expect(isClarifyFollowUp('hm', history)).toBe(false);
  });
});
