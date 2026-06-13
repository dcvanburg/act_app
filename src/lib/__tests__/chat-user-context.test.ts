import { describe, expect, it } from 'vitest';

import {
  formatChatUserContext,
  isUserContextEmpty,
  lastMoodPerDay,
  type ChatUserContextData,
} from '@/lib/chat-user-context';

const emptyContext: ChatUserContextData = {
  complaintTypes: [],
  moodLogs: [],
  waarden: [],
  acties: [],
  barriers: [],
  checkins: [],
  moduleNotes: [],
};

describe('formatChatUserContext', () => {
  it('returns empty string when no user data', () => {
    expect(formatChatUserContext(emptyContext)).toBe('');
    expect(isUserContextEmpty(emptyContext)).toBe(true);
  });

  it('formats mood check-ins with Dutch labels', () => {
    const text = formatChatUserContext({
      ...emptyContext,
      moodLogs: [
        {
          date: '2026-06-10',
          mood_score: 2,
          emotion_tags: ['stress', 'vermoeid'],
          note: 'Drukke dag',
        },
      ],
    });
    expect(text).toContain('Stemming-check-ins');
    expect(text).toContain('Slecht');
    expect(text).toContain('Stress');
    expect(text).toContain('Drukke dag');
  });

  it('formats waarden, acties, barriers and check-ins', () => {
    const text = formatChatUserContext({
      ...emptyContext,
      complaintTypes: ['mental'],
      waarden: [{ id: 'w1', naam: 'Rust', beschrijving: 'Meer ruimte voor mezelf' }],
      acties: [{ waarde_id: null, termijn: 'kort', actie: 'Elke ochtend wandelen' }],
      barriers: [
        {
          waarde_id: null,
          type: 'gedachte',
          eigen_label: null,
          omschrijving: 'Ik heb geen tijd',
        },
      ],
      checkins: [
        {
          waarde_id: null,
          datum: '2026-06-12',
          antwoord: 'neutraal',
          notitie: 'Het lukte half',
        },
      ],
    });
    expect(text).toContain('Mentale klachten');
    expect(text).toContain('Rust');
    expect(text).toContain('Gedeeld waardenplan');
    expect(text).toContain('Elke ochtend wandelen');
    expect(text).toContain('Ik heb geen tijd');
    expect(text).toContain('Neutraal vandaag');
    expect(text).toContain('Het lukte half');
    expect(text).not.toContain('2026-06-12 — Rust');
  });

  it('formats module reflection notes', () => {
    const text = formatChatUserContext({
      ...emptyContext,
      moduleNotes: [
        {
          moduleId: 'recognition',
          title: 'Herkennen',
          notes: 'Ik merk dat ik veel vermijd',
        },
      ],
    });
    expect(text).toContain('Module-reflecties');
    expect(text).toContain('Herkennen');
    expect(text).toContain('Ik merk dat ik veel vermijd');
  });
});

describe('lastMoodPerDay', () => {
  it('keeps the last entry per calendar day', () => {
    const result = lastMoodPerDay([
      { date: '2026-06-10', mood_score: 2, emotion_tags: [], note: null },
      { date: '2026-06-10', mood_score: 4, emotion_tags: [], note: 'later' },
      { date: '2026-06-09', mood_score: 3, emotion_tags: [], note: null },
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.date === '2026-06-10')?.mood_score).toBe(4);
  });
});
