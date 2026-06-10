import { describe, expect, it } from 'vitest';

import {
  buildSeries,
  computeCheckInStreak,
  computeCheckInStreakFromDates,
  dayBefore,
  hasTodayEntry,
  isoDate,
  lastPerDay,
  seriesAverage,
} from '../mood';
import type { MoodLog } from '@/types/content';

function makeLog(overrides: Partial<MoodLog>): MoodLog {
  return {
    id: overrides.id ?? `id-${Math.random()}`,
    user_id: 'user-1',
    date: '2026-06-09',
    mood_score: 3,
    emotion_tags: [],
    note: null,
    created_at: '2026-06-09T10:00:00Z',
    ...overrides,
  };
}

describe('isoDate', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(isoDate(new Date('2026-06-09T15:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('lastPerDay', () => {
  it('keeps the LAST log for each day by created_at', () => {
    const logs = [
      makeLog({ id: 'a', date: '2026-06-09', mood_score: 1, created_at: '2026-06-09T08:00:00Z' }),
      makeLog({ id: 'b', date: '2026-06-09', mood_score: 5, created_at: '2026-06-09T20:00:00Z' }),
      makeLog({ id: 'c', date: '2026-06-08', mood_score: 3, created_at: '2026-06-08T12:00:00Z' }),
    ];
    const map = lastPerDay(logs);
    expect(map.get('2026-06-09')).toBe(5);
    expect(map.get('2026-06-08')).toBe(3);
    expect(map.size).toBe(2);
  });

  it('returns an empty map when no logs', () => {
    expect(lastPerDay([]).size).toBe(0);
  });
});

describe('buildSeries', () => {
  it('always emits exactly `days` points', () => {
    expect(buildSeries([], 7).length).toBe(7);
    expect(buildSeries([], 30).length).toBe(30);
  });

  it('emits days oldest-first', () => {
    const series = buildSeries([], 3);
    expect(new Date(series[0]!.date).getTime()).toBeLessThan(new Date(series[2]!.date).getTime());
  });

  it('emits null when no log for that day', () => {
    const series = buildSeries([], 3);
    expect(series.every((p) => p.score === null)).toBe(true);
  });
});

describe('seriesAverage', () => {
  it('averages non-null scores only', () => {
    const avg = seriesAverage([
      { date: 'd1', score: 5 },
      { date: 'd2', score: null },
      { date: 'd3', score: 3 },
    ]);
    expect(avg).toBe(4);
  });

  it('returns null when all points are null', () => {
    expect(
      seriesAverage([
        { date: 'd1', score: null },
        { date: 'd2', score: null },
      ]),
    ).toBeNull();
  });
});

describe('computeCheckInStreak', () => {
  it('returns zero when there are no logs', () => {
    expect(computeCheckInStreak([], '2026-06-09')).toEqual({ current: 0, totalDays: 0 });
  });

  it('counts consecutive days ending today', () => {
    const logs = [
      makeLog({ date: '2026-06-09' }),
      makeLog({ date: '2026-06-08' }),
      makeLog({ date: '2026-06-07' }),
      makeLog({ date: '2026-06-05' }),
    ];
    expect(computeCheckInStreak(logs, '2026-06-09')).toEqual({ current: 3, totalDays: 4 });
  });

  it('keeps streak alive from yesterday when today is still open', () => {
    const logs = [makeLog({ date: '2026-06-08' }), makeLog({ date: '2026-06-07' })];
    expect(computeCheckInStreak(logs, '2026-06-09')).toEqual({ current: 2, totalDays: 2 });
  });

  it('returns zero current streak when the latest check-in is older than yesterday', () => {
    const logs = [makeLog({ date: '2026-06-06' }), makeLog({ date: '2026-06-05' })];
    expect(computeCheckInStreak(logs, '2026-06-09')).toEqual({ current: 0, totalDays: 2 });
  });
});

describe('dayBefore', () => {
  it('steps back one calendar day', () => {
    expect(dayBefore('2026-06-09')).toBe('2026-06-08');
  });
});

describe('computeCheckInStreakFromDates', () => {
  it('deduplicates multiple entries on the same day', () => {
    expect(
      computeCheckInStreakFromDates(['2026-06-09', '2026-06-09', '2026-06-08'], '2026-06-09'),
    ).toEqual({ current: 2, totalDays: 2 });
  });
});

describe('hasTodayEntry', () => {
  it('true when today is present in the log list', () => {
    const logs = [makeLog({ date: '2026-06-09' })];
    expect(hasTodayEntry(logs, '2026-06-09')).toBe(true);
  });
  it('false otherwise', () => {
    const logs = [makeLog({ date: '2026-06-08' })];
    expect(hasTodayEntry(logs, '2026-06-09')).toBe(false);
  });
});
