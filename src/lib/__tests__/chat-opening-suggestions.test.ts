import { describe, expect, it } from 'vitest';

import { pickChatOpeningSuggestions } from '@/lib/chat-opening-suggestions';
import { getDefaultProgress } from '@/lib/progress';
import type { UserProgress } from '@/types/content';
import type { WaardenData } from '@/types/waarden';

const emptyWaarden: WaardenData = { waarden: [], acties: [], barriers: [], checkins: [] };

describe('pickChatOpeningSuggestions', () => {
  it('suggests the active module and mood when user is in progress with check-ins', () => {
    const progress: UserProgress = {
      ...getDefaultProgress(),
      modules: [
        {
          moduleId: 'acceptance',
          status: 'in_progress',
          startedAt: '2026-06-10T10:00:00.000Z',
        },
      ],
    };

    const suggestions = pickChatOpeningSuggestions({
      progress,
      moodLogs: [
        {
          id: '1',
          user_id: 'u1',
          date: '2026-06-12',
          mood_score: 3,
          emotion_tags: ['stress'],
          note: null,
          created_at: '2026-06-12T08:00:00.000Z',
        },
      ],
      todaysMood: null,
      waarden: emptyWaarden,
      today: '2026-06-12',
    });

    expect(suggestions[0]).toContain('Acceptatie');
    expect(suggestions).toContain('Hoe was mijn stemming de afgelopen dagen?');
    expect(suggestions).toContain('Welke oefening past bij spanning in mijn lichaam?');
  });

  it('suggests next module start for a new user', () => {
    const suggestions = pickChatOpeningSuggestions({
      progress: getDefaultProgress(),
      moodLogs: [],
      todaysMood: null,
      waarden: emptyWaarden,
    });

    expect(suggestions.some((s) => s.includes('Welkom') || s.includes('intake'))).toBe(true);
  });

  it('includes waarden check-in suggestions when waarden exist', () => {
    const suggestions = pickChatOpeningSuggestions({
      progress: getDefaultProgress(),
      moodLogs: [],
      todaysMood: null,
      waarden: {
        waarden: [{ id: 'w1', naam: 'Rust', beschrijving: '', kleur: '#000' }],
        acties: [],
        barriers: [],
        checkins: [
          {
            id: 'c1',
            waarde_id: null,
            datum: '2026-06-11',
            antwoord: 'ja',
            notitie: '',
          },
        ],
      },
      today: '2026-06-12',
    });

    expect(suggestions).toContain('Hoe ging mijn laatste waarden-check-in?');
    expect(suggestions.some((s) => s.includes('Rust') || s.includes('waarden'))).toBe(true);
  });

  it('returns at most the requested limit', () => {
    expect(pickChatOpeningSuggestions({}, 2)).toHaveLength(2);
  });

  it('does not repeat identical suggestions', () => {
    const suggestions = pickChatOpeningSuggestions({
      progress: getDefaultProgress(),
      moodLogs: [],
      todaysMood: null,
      waarden: emptyWaarden,
    });
    const normalized = suggestions.map((s) => s.toLowerCase());
    expect(new Set(normalized).size).toBe(normalized.length);
  });
});
