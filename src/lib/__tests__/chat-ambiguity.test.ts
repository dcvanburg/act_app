import { describe, expect, it } from 'vitest';

import {
  assessClarifyNeed,
  buildClarifyOptions,
  buildTopRetrievalOptions,
  isAmbiguousRetrieval,
  isVagueQuestion,
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
};

const profileWithMood: ChatUserContextData = {
  ...emptyProfile,
  moodLogs: [
    { date: '2026-06-12', mood_score: 3, emotion_tags: ['stress'], note: null },
  ],
};

describe('isVagueQuestion', () => {
  it('flags very short non-topic questions', () => {
    expect(isVagueQuestion('help', [])).toBe(true);
    expect(isVagueQuestion('ik voel me raar', [])).toBe(true);
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
      { metadata: { moduleId: 'acceptance', sectionTitle: 'Acceptatie is niet opgeven' }, rrf_score: 0.02 },
      { metadata: { moduleId: 'recognition', sectionTitle: 'De vermijdingscirkel' }, rrf_score: 0.019 },
    ];
    const decision = assessClarifyNeed('hm', chunks, emptyProfile, []);
    expect(decision?.reason).toBe('ambiguous_retrieval');
    expect(decision?.options).toHaveLength(3);
  });
});

describe('buildClarifyOptions', () => {
  it('includes profile options when mood data exists', () => {
    const options = buildClarifyOptions('hm', [], profileWithMood);
    expect(options.some((o) => o.includes('stemming'))).toBe(true);
  });
});
