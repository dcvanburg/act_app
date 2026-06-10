import { dayBefore, daysAfter, isoDate } from '@/lib/mood';
import type {
  BarriereType,
  Waarde,
  WaardeActie,
  WaardeActieBeoordeling,
  WaardeBarriere,
  WaardeCheckin,
  WaardeCheckinAntwoord,
  WaardenData,
  WaardeTermijn,
} from '@/types/waarden';
import { WAARDEN_KLEUREN } from '@/types/waarden';

export const EMPTY_WAARDEN_DATA: WaardenData = {
  waarden: [],
  acties: [],
  barriers: [],
  checkins: [],
};

/** Calendar days per plan termijn (komende week / maand / kwartaal). */
export const TERMIJN_DAYS: Record<WaardeTermijn, number> = {
  kort: 7,
  middel: 30,
  lang: 90,
};

function isTermijn(value: unknown): value is WaardeTermijn {
  return value === 'kort' || value === 'middel' || value === 'lang';
}

function normalizeBeoordeling(raw: unknown): WaardeActieBeoordeling | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const item = raw as Partial<WaardeActieBeoordeling>;
  if (typeof item.beoordeeld_op !== 'string' || !item.beoordeeld_op) return undefined;
  return {
    behaald: item.behaald === true,
    beschrijving: typeof item.beschrijving === 'string' ? item.beschrijving : '',
    beoordeeld_op: item.beoordeeld_op,
  };
}

function normalizeActie(raw: Partial<WaardeActie>): WaardeActie | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? '');
  const waarde_id = String(raw.waarde_id ?? '');
  const actie = typeof raw.actie === 'string' ? raw.actie.trim() : '';
  if (!id || !waarde_id || !actie) return null;

  const termijn = isTermijn(raw.termijn) ? raw.termijn : 'kort';
  const aangemaakt_op =
    typeof raw.aangemaakt_op === 'string' && raw.aangemaakt_op
      ? raw.aangemaakt_op
      : isoDate();

  return {
    id,
    waarde_id,
    termijn,
    actie,
    aangemaakt_op,
    beoordeling: normalizeBeoordeling(raw.beoordeling),
  };
}

function isAntwoord(value: unknown): value is WaardeCheckinAntwoord {
  return value === 'ja' || value === 'neutraal' || value === 'nee';
}

function isBarriereType(value: unknown): value is BarriereType {
  return (
    value === 'vermijding' ||
    value === 'gedachte' ||
    value === 'zelfkritiek' ||
    value === 'eigen'
  );
}

function normalizeBarriere(raw: Partial<WaardeBarriere>): WaardeBarriere | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? '');
  const waarde_id = String(raw.waarde_id ?? '');
  const omschrijving = typeof raw.omschrijving === 'string' ? raw.omschrijving : '';
  if (!id || !waarde_id || !omschrijving.trim()) return null;

  const type = isBarriereType(raw.type) ? raw.type : 'eigen';
  const eigenLabel =
    type === 'eigen' && typeof raw.eigenLabel === 'string' ? raw.eigenLabel.trim() : undefined;

  const aangemaakt_op =
    typeof raw.aangemaakt_op === 'string' && raw.aangemaakt_op
      ? normalizeWaardeDatum(raw.aangemaakt_op)
      : isoDate();

  return {
    id,
    waarde_id,
    type,
    omschrijving,
    aangemaakt_op,
    ...(eigenLabel ? { eigenLabel } : {}),
  };
}

/** Whether a plan action or barrier was created on the given calendar day. */
export function isWaardeItemFromToday(
  aangemaakt_op: string,
  today: string = isoDate(),
): boolean {
  return normalizeWaardeDatum(aangemaakt_op) === today;
}

/** Guarantee arrays and valid check-in answers after storage or legacy data. */
export function normalizeWaardenData(raw: Partial<WaardenData> | null | undefined): WaardenData {
  const checkins = (raw?.checkins ?? [])
    .filter((item): item is WaardeCheckin => !!item && typeof item === 'object')
    .map((item) => ({
      id: String(item.id ?? ''),
      waarde_id: String(item.waarde_id ?? ''),
      datum: normalizeWaardeDatum(String(item.datum ?? '')),
      antwoord: isAntwoord(item.antwoord) ? item.antwoord : 'nee',
      notitie: typeof item.notitie === 'string' ? item.notitie : '',
    }))
    .filter((item) => item.id && item.waarde_id && item.datum);

  return {
    waarden: Array.isArray(raw?.waarden) ? raw.waarden : [],
    acties: (raw?.acties ?? [])
      .map((item) => normalizeActie(item as Partial<WaardeActie>))
      .filter((item): item is WaardeActie => item !== null),
    barriers: (raw?.barriers ?? [])
      .map((item) => normalizeBarriere(item as Partial<WaardeBarriere>))
      .filter((item): item is WaardeBarriere => item !== null),
    checkins,
  };
}

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Consecutive days with at least one waarden check-in. */
export function computeWaardenStreak(checkins: WaardeCheckin[], today: string = isoDate()): number {
  const days = [...new Set(checkins.map((c) => c.datum))].sort().reverse();
  let streak = 0;
  let expected = today;

  for (const day of days) {
    if (day === expected) {
      streak += 1;
      expected = dayBefore(expected);
    } else {
      break;
    }
  }

  return streak;
}

/** Normalize DB or legacy date strings to YYYY-MM-DD for comparisons. */
export function normalizeWaardeDatum(datum: string): string {
  return datum.length >= 10 ? datum.slice(0, 10) : datum;
}

export function todayCheckins(checkins: WaardeCheckin[], today: string = isoDate()): WaardeCheckin[] {
  return checkins.filter((c) => normalizeWaardeDatum(c.datum) === today);
}

/** Map of today's latest check-in per waarde (last entry wins). */
export function todayCheckinByWaarde(
  checkins: WaardeCheckin[] | null | undefined,
  today: string = isoDate(),
): Map<string, WaardeCheckin> {
  const map = new Map<string, WaardeCheckin>();
  for (const checkin of checkins ?? []) {
    if (normalizeWaardeDatum(checkin.datum) === today) {
      map.set(checkin.waarde_id, checkin);
    }
  }
  return map;
}

export function pendingCheckinWaarden(
  waarden: Waarde[],
  checkins: WaardeCheckin[],
  today: string = isoDate(),
): Waarde[] {
  const doneIds = new Set(todayCheckinByWaarde(checkins, today).keys());
  return waarden.filter((w) => !doneIds.has(w.id));
}

export function defaultKleurForIndex(index: number): string {
  return WAARDEN_KLEUREN[index % WAARDEN_KLEUREN.length] ?? '#5a9be8';
}

export function formatWaardeDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  });
}

export function last14Days(today: string = isoDate()): string[] {
  const days: string[] = [];
  let cursor = today;
  for (let i = 0; i < 14; i++) {
    days.unshift(cursor);
    cursor = dayBefore(cursor);
  }
  return days;
}

export function findWaarde(waarden: Waarde[], id: string): Waarde | undefined {
  return waarden.find((w) => w.id === id);
}

export interface WaardeAntwoordCounts {
  ja: number;
  neutraal: number;
  nee: number;
}

/** Number of waarden with a check-in today (latest per waarde). */
export function todayCheckinCount(
  checkins: WaardeCheckin[],
  today: string = isoDate(),
): number {
  return todayCheckinByWaarde(checkins, today).size;
}

/** Count of today's check-in answers per antwoord type. */
export function todayAntwoordCounts(
  checkins: WaardeCheckin[],
  today: string = isoDate(),
): WaardeAntwoordCounts {
  const counts: WaardeAntwoordCounts = { ja: 0, neutraal: 0, nee: 0 };
  for (const checkin of todayCheckinByWaarde(checkins, today).values()) {
    if (isAntwoord(checkin.antwoord)) {
      counts[checkin.antwoord] += 1;
    }
  }
  return counts;
}

/** ISO date when a plan action's termijn ends (inclusive review day). */
export function actieDeadline(actie: WaardeActie): string {
  return daysAfter(actie.aangemaakt_op, TERMIJN_DAYS[actie.termijn]);
}

/** Active actions still within their termijn window. */
export function activeActiesForWaarde(acties: WaardeActie[], waardeId: string): WaardeActie[] {
  return acties.filter((item) => item.waarde_id === waardeId && !item.beoordeling);
}

/** Actions whose deadline has passed and still need a review. */
export function pendingActieReviews(
  acties: WaardeActie[],
  waardeId: string,
  today: string = isoDate(),
): WaardeActie[] {
  return activeActiesForWaarde(acties, waardeId)
    .filter((item) => today >= actieDeadline(item))
    .sort((a, b) => actieDeadline(a).localeCompare(actieDeadline(b)));
}

export interface WaardeCheckinSummary {
  actiesByTermijn: Record<WaardeTermijn, WaardeActie[]>;
  barriers: WaardeBarriere[];
  /** Rotating daily focus line when both acties and barriers exist. */
  dailyFocus: string | null;
}

function dateSeed(date: string, waardeId: string): number {
  let hash = 0;
  const key = `${date}:${waardeId}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function fillReminderTemplate(
  template: string,
  actie: WaardeActie,
  barriere: WaardeBarriere,
  termijnLabel: string,
  barrierTypeLabel: string,
): string {
  return template
    .replaceAll('{actie}', actie.actie)
    .replaceAll('{termijn}', termijnLabel)
    .replaceAll('{barriere}', barriere.omschrijving)
    .replaceAll('{barriereType}', barrierTypeLabel);
}

/**
 * Structured check-in summary: all active plan actions and recorded barriers.
 * When both exist, adds a rotating daily focus line (varies per calendar day).
 */
export function buildCheckinSummary(
  acties: WaardeActie[],
  barriers: WaardeBarriere[],
  waardeId: string,
  today: string,
  templates: string[],
  termijnLabels: Record<WaardeTermijn, string>,
  barrierTypeLabels: Record<BarriereType, string>,
): WaardeCheckinSummary | null {
  const activeActies = activeActiesForWaarde(acties, waardeId);
  const waardeBarriers = barriers.filter((item) => item.waarde_id === waardeId);
  if (activeActies.length === 0 || waardeBarriers.length === 0) {
    return null;
  }

  const actiesByTermijn: Record<WaardeTermijn, WaardeActie[]> = {
    kort: activeActies.filter((item) => item.termijn === 'kort'),
    middel: activeActies.filter((item) => item.termijn === 'middel'),
    lang: activeActies.filter((item) => item.termijn === 'lang'),
  };

  let dailyFocus: string | null = null;
  if (activeActies.length > 0 && waardeBarriers.length > 0 && templates.length > 0) {
    const seed = dateSeed(today, waardeId);
    const actie = activeActies[seed % activeActies.length]!;
    const barriere = waardeBarriers[(seed >>> 8) % waardeBarriers.length]!;
    const template = templates[(seed >>> 16) % templates.length]!;
    const termijnLabel = termijnLabels[actie.termijn];
    const barrierTypeLabel =
      barriere.type === 'eigen' && barriere.eigenLabel
        ? barriere.eigenLabel
        : barrierTypeLabels[barriere.type];
    dailyFocus = fillReminderTemplate(
      template,
      actie,
      barriere,
      termijnLabel,
      barrierTypeLabel,
    );
  }

  return { actiesByTermijn, barriers: waardeBarriers, dailyFocus };
}
