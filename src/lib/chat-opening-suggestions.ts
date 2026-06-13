/**
 * Personalised opening questions for the chat empty state.
 * Based on module progress, mood check-ins, and waarden check-ins.
 */

import chat from '@/content/nl/chat.json';
import { MODULE_QUESTIONS } from '@/lib/chat-ambiguity';
import { MODULE_META } from '@/lib/content';
import { daysAgo, isoDate } from '@/lib/mood';
import { getDefaultProgress, getModuleStatus, MODULE_ORDER } from '@/lib/progress';
import { pendingCheckinWaarden } from '@/lib/waarden';
import type { EmotionTag, ModuleId, MoodLog, UserProgress } from '@/types/content';
import type { WaardenData } from '@/types/waarden';

const OPENING_LIMIT = 4;
const MOOD_LOOKBACK_DAYS = 7;
const WAARDEN_CHECKIN_LOOKBACK_DAYS = 30;

const TENSION_TAGS: ReadonlySet<EmotionTag> = new Set(['stress', 'pijn', 'angst']);

export type ChatOpeningContext = {
  progress?: UserProgress;
  moodLogs?: MoodLog[];
  todaysMood?: MoodLog | null;
  waarden?: WaardenData;
  today?: string;
};

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFC').trim();
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

function addUnique(target: string[], seen: Set<string>, question: string): boolean {
  const key = normalize(question);
  if (!key || seen.has(key)) return false;
  seen.add(key);
  target.push(question);
  return true;
}

function moduleQuestion(moduleId: ModuleId): string | null {
  return MODULE_QUESTIONS[moduleId] ?? null;
}

function moduleTitle(moduleId: ModuleId): string {
  return MODULE_META[moduleId].title;
}

function getInProgressModuleId(progress: UserProgress): ModuleId | null {
  const inProgress = progress.modules.filter((m) => m.status === 'in_progress');
  if (inProgress.length === 0) return null;

  const sorted = [...inProgress].sort((a, b) => {
    const aTs = a.startedAt ?? '';
    const bTs = b.startedAt ?? '';
    return bTs.localeCompare(aTs);
  });
  return sorted[0]?.moduleId ?? null;
}

/** Active or next module: in-progress first, otherwise first not-yet-started module. */
function getFocusModuleId(progress: UserProgress): ModuleId | null {
  const inProgress = getInProgressModuleId(progress);
  if (inProgress) return inProgress;

  return MODULE_ORDER.find((id) => getModuleStatus(id, progress) === 'available') ?? null;
}

function getLastCompletedModuleId(progress: UserProgress): ModuleId | null {
  const completed = progress.modules.filter((m) => m.status === 'completed' && m.completedAt);
  if (completed.length === 0) return null;

  const sorted = [...completed].sort((a, b) =>
    (b.completedAt ?? '').localeCompare(a.completedAt ?? ''),
  );
  return sorted[0]?.moduleId ?? null;
}

function recentMoodLogs(logs: MoodLog[], today: string): MoodLog[] {
  const from = daysAgo(MOOD_LOOKBACK_DAYS - 1, new Date(`${today}T12:00:00`));
  return logs.filter((log) => log.date >= from && log.date <= today);
}

function latestMoodLog(logs: MoodLog[]): MoodLog | null {
  if (logs.length === 0) return null;
  return [...logs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
}

function hasTensionSignal(log: MoodLog | null | undefined): boolean {
  if (!log) return false;
  return log.emotion_tags.some((tag) => TENSION_TAGS.has(tag));
}

function recentWaardenCheckins(waarden: WaardenData, today: string): boolean {
  const from = daysAgo(WAARDEN_CHECKIN_LOOKBACK_DAYS - 1, new Date(`${today}T12:00:00`));
  return waarden.checkins.some((c) => c.datum >= from && c.datum <= today);
}

/**
 * Picks personalised starter questions when the user opens /chat.
 * Falls back to chat.json suggestedQuestions for new users.
 */
export function pickChatOpeningSuggestions(
  context: ChatOpeningContext = {},
  limit = OPENING_LIMIT,
): string[] {
  const progress = context.progress ?? getDefaultProgress();
  const moodLogs = context.moodLogs ?? [];
  const todaysMood = context.todaysMood ?? null;
  const waarden = context.waarden ?? { waarden: [], acties: [], barriers: [], checkins: [] };
  const today = context.today ?? isoDate();

  const picked: string[] = [];
  const seen = new Set<string>();

  const inProgressId = getInProgressModuleId(progress);
  const focusModuleId = getFocusModuleId(progress);
  const lastCompletedId = getLastCompletedModuleId(progress);
  const recentMoods = recentMoodLogs(moodLogs, today);
  const latestMood = todaysMood ?? latestMoodLog(recentMoods);

  if (focusModuleId) {
    const title = moduleTitle(focusModuleId);
    const status = getModuleStatus(focusModuleId, progress);

    if (status === 'in_progress') {
      addUnique(picked, seen, applyTemplate(chat.openingSuggestions.moduleInProgress, { title }));
    } else {
      addUnique(picked, seen, applyTemplate(chat.openingSuggestions.moduleStart, { title }));
    }

    const topicQuestion = moduleQuestion(focusModuleId);
    if (topicQuestion) addUnique(picked, seen, topicQuestion);
  }

  if (recentMoods.length > 0) {
    addUnique(picked, seen, chat.openingSuggestions.moodRecent);
  }

  if (todaysMood && todaysMood.mood_score <= 2) {
    addUnique(picked, seen, chat.openingSuggestions.moodTodayHeavy);
  }

  if (hasTensionSignal(todaysMood) || hasTensionSignal(latestMood)) {
    addUnique(picked, seen, chat.openingSuggestions.moodTodayTension);
  }

  if (waarden.waarden.length > 0) {
    const pending = pendingCheckinWaarden(waarden.waarden, waarden.checkins, today);
    if (pending.length > 0) {
      addUnique(
        picked,
        seen,
        applyTemplate(chat.openingSuggestions.waardenPending, { waarde: pending[0]!.naam }),
      );
    }

    if (recentWaardenCheckins(waarden, today)) {
      addUnique(picked, seen, chat.openingSuggestions.waardenCheckinRecent);
    }

    addUnique(picked, seen, chat.openingSuggestions.waardenOverview);
  }

  if (inProgressId && picked.length < limit) {
    addUnique(
      picked,
      seen,
      applyTemplate(chat.openingSuggestions.moduleStuck, {
        title: moduleTitle(inProgressId),
      }),
    );
  }

  if (
    lastCompletedId &&
    lastCompletedId !== focusModuleId &&
    picked.length < limit
  ) {
    addUnique(
      picked,
      seen,
      applyTemplate(chat.openingSuggestions.lastModuleReview, {
        title: moduleTitle(lastCompletedId),
      }),
    );
  }

  for (const moduleId of MODULE_ORDER) {
    if (picked.length >= limit) break;
    const topicQuestion = moduleQuestion(moduleId);
    if (topicQuestion) addUnique(picked, seen, topicQuestion);
  }

  for (const fallback of chat.suggestedQuestions) {
    if (picked.length >= limit) break;
    addUnique(picked, seen, fallback);
  }

  return picked.slice(0, limit);
}
