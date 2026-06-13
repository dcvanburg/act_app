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

/** Shared plan / barriers / check-ins are scoped with a null waarde_id. */
export function isCollectionScope(waardeId: string | null | undefined): boolean {
  return waardeId === null || waardeId === undefined;
}

export function collectionActies(acties: WaardeActie[]): WaardeActie[] {
  return acties.filter((item) => isCollectionScope(item.waarde_id));
}

export function collectionBarriers(barriers: WaardeBarriere[]): WaardeBarriere[] {
  return barriers.filter((item) => isCollectionScope(item.waarde_id));
}

export function collectionCheckins(checkins: WaardeCheckin[]): WaardeCheckin[] {
  return checkins.filter((item) => isCollectionScope(item.waarde_id));
}

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

function normalizeWaardeScopeId(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  return String(raw);
}

function normalizeActie(raw: Partial<WaardeActie>): WaardeActie | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? '');
  const actie = typeof raw.actie === 'string' ? raw.actie.trim() : '';
  if (!id || !actie) return null;

  const termijn = isTermijn(raw.termijn) ? raw.termijn : 'kort';
  const aangemaakt_op =
    typeof raw.aangemaakt_op === 'string' && raw.aangemaakt_op ? raw.aangemaakt_op : isoDate();

  return {
    id,
    waarde_id: normalizeWaardeScopeId(raw.waarde_id),
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
    value === 'vermijding' || value === 'gedachte' || value === 'zelfkritiek' || value === 'eigen'
  );
}

function normalizeBarriere(raw: Partial<WaardeBarriere>): WaardeBarriere | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? '');
  const omschrijving = typeof raw.omschrijving === 'string' ? raw.omschrijving : '';
  if (!id || !omschrijving.trim()) return null;

  const type = isBarriereType(raw.type) ? raw.type : 'eigen';
  const eigenLabel =
    type === 'eigen' && typeof raw.eigenLabel === 'string' ? raw.eigenLabel.trim() : undefined;

  const aangemaakt_op =
    typeof raw.aangemaakt_op === 'string' && raw.aangemaakt_op
      ? normalizeWaardeDatum(raw.aangemaakt_op)
      : isoDate();

  return {
    id,
    waarde_id: normalizeWaardeScopeId(raw.waarde_id),
    type,
    omschrijving,
    aangemaakt_op,
    ...(eigenLabel ? { eigenLabel } : {}),
  };
}

/** Whether a plan action or barrier was created on the given calendar day. */
export function isWaardeItemFromToday(aangemaakt_op: string, today: string = isoDate()): boolean {
  return normalizeWaardeDatum(aangemaakt_op) === today;
}

function hasLegacyPerWaardeScope(data: WaardenData): boolean {
  return (
    data.acties.some((item) => !isCollectionScope(item.waarde_id)) ||
    data.barriers.some((item) => !isCollectionScope(item.waarde_id)) ||
    data.checkins.some((item) => !isCollectionScope(item.waarde_id))
  );
}

/** Upgrade per-waarde plan/barriers/check-ins to shared collection scope. */
export function upgradeToCollectionScope(data: WaardenData): WaardenData {
  if (!hasLegacyPerWaardeScope(data)) return data;

  const acties = data.acties.map((item) => ({ ...item, waarde_id: null }));
  const barriers = data.barriers.map((item) => ({ ...item, waarde_id: null }));

  const checkinsByDay = new Map<string, WaardeCheckin>();
  for (const item of data.checkins) {
    checkinsByDay.set(item.datum, { ...item, waarde_id: null });
  }
  const checkins = [...checkinsByDay.values()].sort((a, b) => a.datum.localeCompare(b.datum));

  return { waarden: data.waarden, acties, barriers, checkins };
}

function kleurSortIndex(kleur: string): number {
  const normalized = kleur.trim().toLowerCase();
  const index = WAARDEN_KLEUREN.findIndex((option) => option.toLowerCase() === normalized);
  return index >= 0 ? index : WAARDEN_KLEUREN.length;
}

/** Sort waarden by palette color, then alphabetically by name (nl). */
export function sortWaarden(waarden: Waarde[]): Waarde[] {
  return [...waarden].sort((a, b) => {
    const byColor = kleurSortIndex(a.kleur) - kleurSortIndex(b.kleur);
    if (byColor !== 0) return byColor;
    return a.naam.localeCompare(b.naam, 'nl', { sensitivity: 'base' });
  });
}

/** Guarantee arrays and valid check-in answers after storage or legacy data. */
export function normalizeWaardenData(raw: Partial<WaardenData> | null | undefined): WaardenData {
  const checkins = (raw?.checkins ?? [])
    .filter((item): item is WaardeCheckin => !!item && typeof item === 'object')
    .map((item) => ({
      id: String(item.id ?? ''),
      waarde_id: normalizeWaardeScopeId(item.waarde_id),
      datum: normalizeWaardeDatum(String(item.datum ?? '')),
      antwoord: isAntwoord(item.antwoord) ? item.antwoord : 'nee',
      notitie: typeof item.notitie === 'string' ? item.notitie : '',
    }))
    .filter((item) => item.id && item.datum);

  const normalized: WaardenData = {
    waarden: sortWaarden(Array.isArray(raw?.waarden) ? raw.waarden : []),
    acties: (raw?.acties ?? [])
      .map((item) => normalizeActie(item as Partial<WaardeActie>))
      .filter((item): item is WaardeActie => item !== null),
    barriers: (raw?.barriers ?? [])
      .map((item) => normalizeBarriere(item as Partial<WaardeBarriere>))
      .filter((item): item is WaardeBarriere => item !== null),
    checkins,
  };

  return upgradeToCollectionScope(normalized);
}

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Consecutive days with a collection check-in. */
export function computeWaardenStreak(checkins: WaardeCheckin[], today: string = isoDate()): number {
  const days = [...new Set(collectionCheckins(checkins).map((c) => c.datum))]
    .sort()
    .reverse();
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

export function todayCheckins(
  checkins: WaardeCheckin[],
  today: string = isoDate(),
): WaardeCheckin[] {
  return checkins.filter((c) => normalizeWaardeDatum(c.datum) === today);
}

export function todayCollectionCheckin(
  checkins: WaardeCheckin[],
  today: string = isoDate(),
): WaardeCheckin | null {
  const entries = collectionCheckins(checkins).filter(
    (c) => normalizeWaardeDatum(c.datum) === today,
  );
  return entries.length > 0 ? (entries[entries.length - 1] ?? null) : null;
}

/** Whether the user still needs to complete today's collection check-in. */
export function needsCollectionCheckin(
  waarden: Waarde[],
  checkins: WaardeCheckin[],
  today: string = isoDate(),
): boolean {
  return waarden.length > 0 && todayCollectionCheckin(checkins, today) === null;
}

const PLAN_TERMIJNEN: readonly WaardeTermijn[] = ['kort', 'middel', 'lang'];

export interface CollectionPlanSetupGaps {
  missingTermijnen: WaardeTermijn[];
  missingBarriers: boolean;
}

export function getCollectionPlanSetupGaps(
  acties: WaardeActie[],
  barriers: WaardeBarriere[],
): CollectionPlanSetupGaps {
  const planActies = collectionActies(acties);
  const planBarriers = collectionBarriers(barriers);
  return {
    missingTermijnen: PLAN_TERMIJNEN.filter(
      (termijn) => !planActies.some((item) => item.termijn === termijn),
    ),
    missingBarriers: planBarriers.length === 0,
  };
}

/** Whether the shared plan still needs actions (all termijnen) and at least one barrier. */
export function needsCollectionPlanSetup(
  acties: WaardeActie[],
  barriers: WaardeBarriere[],
): boolean {
  const gaps = getCollectionPlanSetupGaps(acties, barriers);
  return gaps.missingTermijnen.length > 0 || gaps.missingBarriers;
}

export function buildCollectionPlanSetupItems(
  gaps: CollectionPlanSetupGaps,
  termijnLabels: Record<WaardeTermijn, string>,
  templates: { action: string; barriers: string },
): string[] {
  const items: string[] = [];
  for (const termijn of gaps.missingTermijnen) {
    items.push(
      templates.action.replace('{termijn}', termijnLabels[termijn].toLowerCase()),
    );
  }
  if (gaps.missingBarriers) {
    items.push(templates.barriers);
  }
  return items;
}

/** @deprecated Use needsCollectionCheckin — kept for transitional imports. */
export function pendingCheckinWaarden(
  waarden: Waarde[],
  checkins: WaardeCheckin[],
  today: string = isoDate(),
): Waarde[] {
  return needsCollectionCheckin(waarden, checkins, today) ? waarden : [];
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

export function last7Days(today: string = isoDate()): string[] {
  const days: string[] = [];
  let cursor = today;
  for (let i = 0; i < 7; i++) {
    days.unshift(cursor);
    cursor = dayBefore(cursor);
  }
  return days;
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

/** Whether today's collection check-in is complete. */
export function hasCollectionCheckinToday(
  checkins: WaardeCheckin[],
  today: string = isoDate(),
): boolean {
  return todayCollectionCheckin(checkins, today) !== null;
}

/** @deprecated Use hasCollectionCheckinToday. */
export function todayCheckinCount(checkins: WaardeCheckin[], today: string = isoDate()): number {
  return hasCollectionCheckinToday(checkins, today) ? 1 : 0;
}

/** Count of today's check-in answer (0 or 1). */
export function todayAntwoordCounts(
  checkins: WaardeCheckin[],
  today: string = isoDate(),
): WaardeAntwoordCounts {
  const counts: WaardeAntwoordCounts = { ja: 0, neutraal: 0, nee: 0 };
  const entry = todayCollectionCheckin(checkins, today);
  if (entry && isAntwoord(entry.antwoord)) {
    counts[entry.antwoord] = 1;
  }
  return counts;
}

/** ISO date when a plan action's termijn ends (inclusive review day). */
export function actieDeadline(actie: WaardeActie): string {
  return daysAfter(actie.aangemaakt_op, TERMIJN_DAYS[actie.termijn]);
}

/** Active collection actions still within their termijn window. */
export function activeCollectionActies(acties: WaardeActie[]): WaardeActie[] {
  return collectionActies(acties).filter((item) => !item.beoordeling);
}

/** @deprecated Use activeCollectionActies. */
export function activeActiesForWaarde(acties: WaardeActie[], _waardeId: string): WaardeActie[] {
  return activeCollectionActies(acties);
}

/** Collection actions whose deadline has passed and still need a review. */
export function pendingCollectionActieReviews(
  acties: WaardeActie[],
  today: string = isoDate(),
): WaardeActie[] {
  return activeCollectionActies(acties)
    .filter((item) => today >= actieDeadline(item))
    .sort((a, b) => actieDeadline(a).localeCompare(actieDeadline(b)));
}

/** @deprecated Use pendingCollectionActieReviews. */
export function pendingActieReviews(
  acties: WaardeActie[],
  _waardeId: string,
  today: string = isoDate(),
): WaardeActie[] {
  return pendingCollectionActieReviews(acties, today);
}

export interface WaardeCheckinSummary {
  actiesByTermijn: Record<WaardeTermijn, WaardeActie[]>;
  barriers: WaardeBarriere[];
  /** Rotating daily focus line when both acties and barriers exist. */
  dailyFocus: string | null;
}

function dateSeed(date: string, scopeKey: string): number {
  let hash = 0;
  const key = `${date}:${scopeKey}`;
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
  today: string,
  templates: string[],
  termijnLabels: Record<WaardeTermijn, string>,
  barrierTypeLabels: Record<BarriereType, string>,
): WaardeCheckinSummary | null {
  const activeActies = activeCollectionActies(acties);
  const scopedBarriers = collectionBarriers(barriers);
  if (activeActies.length === 0 || scopedBarriers.length === 0) {
    return null;
  }

  const actiesByTermijn: Record<WaardeTermijn, WaardeActie[]> = {
    kort: activeActies.filter((item) => item.termijn === 'kort'),
    middel: activeActies.filter((item) => item.termijn === 'middel'),
    lang: activeActies.filter((item) => item.termijn === 'lang'),
  };

  let dailyFocus: string | null = null;
  if (activeActies.length > 0 && scopedBarriers.length > 0 && templates.length > 0) {
    const seed = dateSeed(today, 'collection');
    const actie = activeActies[seed % activeActies.length]!;
    const barriere = scopedBarriers[(seed >>> 8) % scopedBarriers.length]!;
    const template = templates[(seed >>> 16) % templates.length]!;
    const termijnLabel = termijnLabels[actie.termijn];
    const barrierTypeLabel =
      barriere.type === 'eigen' && barriere.eigenLabel
        ? barriere.eigenLabel
        : barrierTypeLabels[barriere.type];
    dailyFocus = fillReminderTemplate(template, actie, barriere, termijnLabel, barrierTypeLabel);
  }

  return { actiesByTermijn, barriers: scopedBarriers, dailyFocus };
}
