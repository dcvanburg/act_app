import { describe, expect, it } from 'vitest';

import { pickChatSuggestions } from '@/lib/chat-suggestions';

describe('pickChatSuggestions', () => {
  it('suggests acceptance topic when question mentions acceptatie', () => {
    const suggestions = pickChatSuggestions('Ik snap acceptatie niet helemaal');
    expect(suggestions).toContain('Wat betekent acceptatie in dit programma?');
  });

  it('suggests body exercise when question mentions spanning', () => {
    const suggestions = pickChatSuggestions('Ik heb veel spanning in mijn lichaam');
    expect(suggestions).toContain('Welke oefening helpt bij spanning in mijn lichaam?');
  });

  it('suggests vermijdingscirkel for vermijding keywords', () => {
    const suggestions = pickChatSuggestions('Ik merk dat ik veel vermijd');
    expect(suggestions).toContain('Wat is de vermijdingscirkel?');
  });

  it('falls back to default suggestions for vague questions', () => {
    const suggestions = pickChatSuggestions('Ik voel me raar vandaag');
    expect(suggestions.length).toBe(3);
    expect(suggestions.every((s) => s.length > 10)).toBe(true);
  });

  it('does not repeat the question the user already asked', () => {
    const q = 'Wat betekent acceptatie in dit programma?';
    const suggestions = pickChatSuggestions(q);
    expect(suggestions).not.toContain(q);
  });

  it('returns at most the requested limit', () => {
    expect(pickChatSuggestions('hallo', 2)).toHaveLength(2);
  });
});
