/**
 * Formats signed-in user data for the RAG chatbot system prompt (ADR-005).
 * Fetched server-side in the search Edge Function; never sent from the client.
 */

import intake from '@/content/nl/intake.json';
import moodContent from '@/content/nl/mood.json';
import waardenContent from '@/content/nl/waarden.json';
import type { ComplaintType, EmotionTag, ModuleId, MoodScore } from '@/types/content';
import type { BarriereType, WaardeCheckinAntwoord, WaardeTermijn } from '@/types/waarden';

const MOOD_SCORE_LABELS: Record<MoodScore, string> = Object.fromEntries(
  moodContent.scores.map((s) => [s.value, s.label]),
) as Record<MoodScore, string>;

const EMOTION_LABELS: Record<EmotionTag, string> = Object.fromEntries(
  moodContent.tags.map((t) => [t.id, t.label]),
) as Record<EmotionTag, string>;

const CHECKIN_LABELS: Record<WaardeCheckinAntwoord, string> = {
  ja: waardenContent.checkin.handledYes,
  neutraal: waardenContent.checkin.handledNeutral,
  nee: waardenContent.checkin.handledNo,
};

const BARRIER_LABELS: Record<BarriereType, string> = waardenContent.barrierTypes as Record<
  BarriereType,
  string
>;

const TERMIJN_LABELS: Record<WaardeTermijn, string> = waardenContent.checkin.termijnLabels;

const COMPLAINT_LABELS: Record<ComplaintType, string> = {
  pain: intake.complaintTypes.options.pain.label,
  mental: intake.complaintTypes.options.mental.label,
  alcohol: intake.complaintTypes.options.alcohol.label,
  combination: intake.complaintTypes.options.combination.label,
};

const MAX_NOTE_LENGTH = 500;

export type ChatMoodEntry = {
  date: string;
  mood_score: MoodScore;
  emotion_tags: EmotionTag[];
  note: string | null;
};

export type ChatWaarde = {
  id: string;
  naam: string;
  beschrijving: string;
};

export type ChatWaardeActie = {
  waarde_id: string | null;
  termijn: WaardeTermijn;
  actie: string;
  beoordeling?: {
    behaald: boolean;
    beschrijving: string;
    beoordeeld_op: string;
  };
};

export type ChatWaardeBarriere = {
  waarde_id: string | null;
  type: BarriereType;
  eigen_label: string | null;
  omschrijving: string;
};

export type ChatWaardeCheckin = {
  waarde_id: string | null;
  datum: string;
  antwoord: WaardeCheckinAntwoord;
  notitie: string;
};

export type ChatModuleNote = {
  moduleId: ModuleId;
  title: string;
  notes: string;
};

export type ChatUserContextData = {
  complaintTypes: ComplaintType[];
  moodLogs: ChatMoodEntry[];
  waarden: ChatWaarde[];
  acties: ChatWaardeActie[];
  barriers: ChatWaardeBarriere[];
  checkins: ChatWaardeCheckin[];
  moduleNotes: ChatModuleNote[];
};

function truncateNote(note: string | null | undefined): string | null {
  if (!note?.trim()) return null;
  const trimmed = note.trim();
  return trimmed.length > MAX_NOTE_LENGTH ? `${trimmed.slice(0, MAX_NOTE_LENGTH)}…` : trimmed;
}

function waardeName(waarden: ChatWaarde[], id: string | null): string {
  if (id === null) return 'waardenverzameling';
  return waarden.find((w) => w.id === id)?.naam ?? 'Onbekende waarde';
}

/** Last mood entry per calendar day (most recent created_at wins). */
export function lastMoodPerDay(logs: ChatMoodEntry[]): ChatMoodEntry[] {
  const byDate = new Map<string, ChatMoodEntry>();
  for (const log of [...logs].sort((a, b) => a.date.localeCompare(b.date))) {
    byDate.set(log.date, log);
  }
  return [...byDate.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([, log]) => log);
}

export function isUserContextEmpty(data: ChatUserContextData): boolean {
  return (
    data.complaintTypes.length === 0 &&
    data.moodLogs.length === 0 &&
    data.waarden.length === 0 &&
    data.acties.length === 0 &&
    data.barriers.length === 0 &&
    data.checkins.length === 0 &&
    data.moduleNotes.length === 0
  );
}

/**
 * Dutch summary block for the LLM. Omits sections with no data.
 * Never log this output — it contains Article 9 data.
 */
export function formatChatUserContext(data: ChatUserContextData): string {
  const sections: string[] = [];

  if (data.complaintTypes.length > 0) {
    const labels = data.complaintTypes.map((t) => COMPLAINT_LABELS[t]).join(', ');
    sections.push(`Intake (wat bij de gebruiker speelt): ${labels}`);
  }

  const moodDays = lastMoodPerDay(data.moodLogs);
  if (moodDays.length > 0) {
    const lines = moodDays.map((log) => {
      const score = MOOD_SCORE_LABELS[log.mood_score] ?? String(log.mood_score);
      const tags =
        log.emotion_tags.length > 0
          ? log.emotion_tags.map((t) => EMOTION_LABELS[t] ?? t).join(', ')
          : 'geen gevoelens gekozen';
      const note = truncateNote(log.note);
      return `• ${log.date}: stemming ${score} (${tags})${note ? ` — notitie: «${note}»` : ''}`;
    });
    sections.push(`Stemming-check-ins (laatste per dag):\n${lines.join('\n')}`);
  }

  if (data.waarden.length > 0) {
    const lines = data.waarden.map((w) => {
      const desc = truncateNote(w.beschrijving) ?? '';
      return `• ${w.naam}${desc ? `: ${desc}` : ''}`;
    });
    sections.push(`Persoonlijke waarden:\n${lines.join('\n')}`);
  }

  if (data.acties.length > 0) {
    const lines = data.acties.map((a) => {
      const termijn = TERMIJN_LABELS[a.termijn] ?? a.termijn;
      const review = a.beoordeling
        ? ` — evaluatie: ${a.beoordeling.behaald ? 'behaald' : 'niet behaald'} (${a.beoordeling.beschrijving})`
        : '';
      return `• ${waardeName(data.waarden, a.waarde_id)} — actie (${termijn}): «${a.actie}»${review}`;
    });
    sections.push(`Gedeeld waardenplan:\n${lines.join('\n')}`);
  }

  if (data.barriers.length > 0) {
    const lines = data.barriers.map((b) => {
      const typeLabel =
        b.type === 'eigen' && b.eigen_label ? b.eigen_label : (BARRIER_LABELS[b.type] ?? b.type);
      const scope = waardeName(data.waarden, b.waarde_id);
      return `• ${scope} — barrière (${typeLabel}): «${b.omschrijving}»`;
    });
    sections.push(`Barrières in het waardenplan:\n${lines.join('\n')}`);
  }

  if (data.checkins.length > 0) {
    const lines = data.checkins.map((c) => {
      const antwoord = CHECKIN_LABELS[c.antwoord] ?? c.antwoord;
      const note = truncateNote(c.notitie);
      return `• ${c.datum}: ${antwoord}${note ? ` — «${note}»` : ''}`;
    });
    sections.push(`Waarden-check-ins:\n${lines.join('\n')}`);
  }

  if (data.moduleNotes.length > 0) {
    const lines = data.moduleNotes.map((m) => {
      const note = truncateNote(m.notes);
      return note ? `• ${m.title}: «${note}»` : `• ${m.title}`;
    });
    sections.push(`Module-reflecties:\n${lines.join('\n')}`);
  }

  if (sections.length === 0) {
    return '';
  }

  return sections.join('\n\n');
}
