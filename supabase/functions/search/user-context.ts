/**
 * Fetches signed-in user context for the chatbot (server-side only, JWT + RLS).
 * Formatting mirrors src/lib/chat-user-context.ts — keep both in sync.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const MOOD_DAYS = 14;
const CHECKIN_DAYS = 30;

type ComplaintType = 'pain' | 'mental' | 'alcohol' | 'combination';
type MoodScore = 1 | 2 | 3 | 4 | 5;
type EmotionTag =
  | 'angst'
  | 'verdriet'
  | 'boos'
  | 'stress'
  | 'pijn'
  | 'vermoeid'
  | 'rustig'
  | 'ontspannen'
  | 'hoopvol'
  | 'blij'
  | 'dankbaar'
  | 'tevreden'
  | 'energiek'
  | 'trots'
  | 'verbonden';
type WaardeTermijn = 'kort' | 'middel' | 'lang';
type BarriereType = 'vermijding' | 'gedachte' | 'zelfkritiek' | 'eigen';
type WaardeCheckinAntwoord = 'ja' | 'neutraal' | 'nee';
type ModuleId =
  | 'onboarding'
  | 'recognition'
  | 'acceptance'
  | 'defusion'
  | 'presence'
  | 'self-as-context'
  | 'values'
  | 'committed-action';

export type ChatUserContextData = {
  complaintTypes: ComplaintType[];
  moodLogs: Array<{
    date: string;
    mood_score: MoodScore;
    emotion_tags: EmotionTag[];
    note: string | null;
  }>;
  waarden: Array<{ id: string; naam: string; beschrijving: string }>;
  acties: Array<{
    waarde_id: string | null;
    termijn: WaardeTermijn;
    actie: string;
    beoordeling?: { behaald: boolean; beschrijving: string; beoordeeld_op: string };
  }>;
  barriers: Array<{
    waarde_id: string | null;
    type: BarriereType;
    eigen_label: string | null;
    omschrijving: string;
  }>;
  checkins: Array<{
    waarde_id: string | null;
    datum: string;
    antwoord: WaardeCheckinAntwoord;
    notitie: string;
  }>;
  moduleNotes: Array<{ moduleId: ModuleId; title: string; notes: string }>;
};

const MOOD_SCORE_LABELS: Record<MoodScore, string> = {
  1: 'Heel slecht',
  2: 'Slecht',
  3: 'Neutraal',
  4: 'Goed',
  5: 'Heel goed',
};

const EMOTION_LABELS: Record<EmotionTag, string> = {
  angst: 'Angst',
  verdriet: 'Verdriet',
  boos: 'Boos',
  stress: 'Stress',
  pijn: 'Pijn',
  vermoeid: 'Vermoeid',
  rustig: 'Rustig',
  ontspannen: 'Ontspannen',
  hoopvol: 'Hoopvol',
  blij: 'Blij',
  dankbaar: 'Dankbaar',
  tevreden: 'Tevreden',
  energiek: 'Energiek',
  trots: 'Trots',
  verbonden: 'Verbonden',
};

const CHECKIN_LABELS: Record<WaardeCheckinAntwoord, string> = {
  ja: 'Gehandeld naar deze waarde',
  neutraal: 'Neutraal vandaag',
  nee: 'Niet gehandeld vandaag',
};

const BARRIER_LABELS: Record<BarriereType, string> = {
  vermijding: 'Vermijding',
  gedachte: 'Moeilijke gedachten',
  zelfkritiek: 'Zelfkritiek',
  eigen: 'Eigen',
};

const TERMIJN_LABELS: Record<WaardeTermijn, string> = {
  kort: 'komende week',
  middel: 'komende maand',
  lang: 'komend kwartaal',
};

const COMPLAINT_LABELS: Record<ComplaintType, string> = {
  pain: 'Chronische pijn',
  mental: 'Mentale klachten',
  alcohol: 'Alcohol of verslaving',
  combination: 'Combinatie',
};

const MAX_NOTE_LENGTH = 500;

const MODULE_TITLES: Record<ModuleId, string> = {
  onboarding: 'Welkom & Intake',
  recognition: 'Herkennen',
  acceptance: 'Acceptatie',
  defusion: 'Defusie',
  presence: 'Aanwezig zijn',
  'self-as-context': 'Zelf-als-context',
  values: 'Waarden',
  'committed-action': 'Toegewijd handelen',
};

function isoDateDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function truncateNote(note: string | null | undefined): string | null {
  if (!note?.trim()) return null;
  const trimmed = note.trim();
  return trimmed.length > MAX_NOTE_LENGTH ? `${trimmed.slice(0, MAX_NOTE_LENGTH)}…` : trimmed;
}

function waardeName(waarden: ChatUserContextData['waarden'], id: string | null): string {
  if (id === null) return 'waardenverzameling';
  return waarden.find((w) => w.id === id)?.naam ?? 'Onbekende waarde';
}

function lastMoodPerDay(logs: ChatUserContextData['moodLogs']) {
  const byDate = new Map<string, ChatUserContextData['moodLogs'][number]>();
  for (const log of [...logs].sort((a, b) => a.date.localeCompare(b.date))) {
    byDate.set(log.date, log);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, log]) => log);
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

  return sections.length > 0 ? sections.join('\n\n') : '';
}

export async function fetchFirstName(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(`profiles: ${error.message}`);
  const name = data?.first_name;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

export async function fetchChatUserContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<ChatUserContextData> {
  const moodFrom = isoDateDaysAgo(MOOD_DAYS - 1);
  const checkinFrom = isoDateDaysAgo(CHECKIN_DAYS - 1);

  const [moodRes, waardenRes, actiesRes, barriersRes, checkinsRes, progressRes] = await Promise.all([
    supabase
      .from('mood_logs')
      .select('date, mood_score, emotion_tags, note, created_at')
      .eq('user_id', userId)
      .gte('date', moodFrom)
      .order('created_at', { ascending: false }),
    supabase.from('waarden').select('id, naam, beschrijving').eq('user_id', userId),
    supabase
      .from('waarde_acties')
      .select('waarde_id, termijn, actie, beoordeling')
      .eq('user_id', userId),
    supabase
      .from('waarde_barriers')
      .select('waarde_id, type, eigen_label, omschrijving')
      .eq('user_id', userId),
    supabase
      .from('waarde_checkins')
      .select('waarde_id, datum, antwoord, notitie')
      .eq('user_id', userId)
      .gte('datum', checkinFrom)
      .order('datum', { ascending: false }),
    supabase.from('user_progress').select('progress').eq('user_id', userId).maybeSingle(),
  ]);

  if (moodRes.error) throw new Error(`mood_logs: ${moodRes.error.message}`);
  if (waardenRes.error) throw new Error(`waarden: ${waardenRes.error.message}`);
  if (actiesRes.error) throw new Error(`waarde_acties: ${actiesRes.error.message}`);
  if (barriersRes.error) throw new Error(`waarde_barriers: ${barriersRes.error.message}`);
  if (checkinsRes.error) throw new Error(`waarde_checkins: ${checkinsRes.error.message}`);
  if (progressRes.error) throw new Error(`user_progress: ${progressRes.error.message}`);

  const progress = progressRes.data?.progress as
    | {
        intake?: { complaintTypes?: ComplaintType[] };
        modules?: Array<{ moduleId?: string; notes?: string }>;
      }
    | undefined;
  const complaintTypes = (progress?.intake?.complaintTypes ?? []).filter(
    (t): t is ComplaintType =>
      t === 'pain' || t === 'mental' || t === 'alcohol' || t === 'combination',
  );

  const moduleNotes = (progress?.modules ?? [])
    .filter((m): m is { moduleId: ModuleId; notes: string } => {
      if (!m.moduleId || !m.notes?.trim()) return false;
      return m.moduleId in MODULE_TITLES;
    })
    .map((m) => ({
      moduleId: m.moduleId,
      title: MODULE_TITLES[m.moduleId],
      notes: m.notes.trim(),
    }));

  return {
    complaintTypes,
    moodLogs: (moodRes.data ?? []).map((row) => ({
      date: row.date as string,
      mood_score: row.mood_score as MoodScore,
      emotion_tags: (row.emotion_tags ?? []) as EmotionTag[],
      note: (row.note as string | null) ?? null,
    })),
    waarden: (waardenRes.data ?? []).map((row) => ({
      id: row.id as string,
      naam: row.naam as string,
      beschrijving: (row.beschrijving as string) ?? '',
    })),
    acties: (actiesRes.data ?? []).map((row) => ({
      waarde_id: (row.waarde_id as string | null) ?? null,
      termijn: row.termijn as WaardeTermijn,
      actie: row.actie as string,
      beoordeling: row.beoordeling as ChatUserContextData['acties'][number]['beoordeling'],
    })),
    barriers: (barriersRes.data ?? []).map((row) => ({
      waarde_id: (row.waarde_id as string | null) ?? null,
      type: row.type as BarriereType,
      eigen_label: (row.eigen_label as string | null) ?? null,
      omschrijving: row.omschrijving as string,
    })),
    checkins: (checkinsRes.data ?? []).map((row) => ({
      waarde_id: (row.waarde_id as string | null) ?? null,
      datum: row.datum as string,
      antwoord: row.antwoord as WaardeCheckinAntwoord,
      notitie: (row.notitie as string) ?? '',
    })),
    moduleNotes,
  };
}
