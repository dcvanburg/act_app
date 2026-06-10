import type { MoodLog, MoodScore } from '@/types/content';

/** ISO date YYYY-MM-DD in the device's local timezone. */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Mid-week of a given Date — used for weekly aggregations. */
export function daysAgo(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

/**
 * Reduce N mood logs down to a single "day score" — the LAST mood entered for
 * that day. We don't average within a day because a 1+5 average masks the
 * lived experience.
 *
 * Returns a map keyed by ISO date.
 */
export function lastPerDay(logs: MoodLog[]): Map<string, MoodScore> {
  const sorted = [...logs].sort((a, b) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
  );
  const out = new Map<string, MoodScore>();
  for (const log of sorted) {
    out.set(log.date, log.mood_score);
  }
  return out;
}

/**
 * Build a fixed-length series of last `days` calendar days, oldest first.
 * Each entry holds the day's last mood (or null if no entry that day).
 */
export interface MoodPoint {
  date: string;
  score: MoodScore | null;
}

export function buildSeries(logs: MoodLog[], days: number): MoodPoint[] {
  const perDay = lastPerDay(logs);
  const out: MoodPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    out.push({ date: d, score: perDay.get(d) ?? null });
  }
  return out;
}

/** Arithmetic mean over the non-null points, or null if no data. */
export function seriesAverage(series: MoodPoint[]): number | null {
  const scores = series.map((p) => p.score).filter((s): s is MoodScore => s !== null);
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return sum / scores.length;
}

/** Whether there is a mood entry for today in `logs`. */
export function hasTodayEntry(logs: MoodLog[], today: string = isoDate()): boolean {
  return logs.some((l) => l.date === today);
}
