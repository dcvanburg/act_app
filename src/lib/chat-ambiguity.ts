/**
 * Retrieval confidence and clarify-option logic for the RAG chatbot.
 * Mirror in supabase/functions/search/ambiguity.ts — keep both in sync.
 */

import type { ChatUserContextData } from '@/lib/chat-user-context';

export type RetrievalChunk = {
  metadata: Record<string, unknown>;
  rrf_score: number;
};

export type ClarifyDecision = {
  reason: 'vague_question' | 'weak_retrieval' | 'ambiguous_retrieval' | 'mixed_intent';
  options: string[];
};

const MIN_RRF_SCORE = 0.012;
/** Top hit must be clearly ahead of #2 before we skip ambiguous clarify. */
const CLEAR_WINNER_RATIO = 1.12;
const OPTION_COUNT = 3;

export const MODULE_QUESTIONS: Record<string, string> = {
  onboarding: 'Wat houdt de intake en het welkom in het programma in?',
  recognition: 'Wat is de vermijdingscirkel?',
  acceptance: 'Wat betekent acceptatie in dit programma?',
  defusion: 'Wat is defusie en hoe werkt het in dit programma?',
  presence: 'Wat betekent aanwezig zijn in dit programma?',
  'self-as-context': 'Wat is zelf-als-context?',
  values: 'Hoe werk ik met mijn waarden in dit programma?',
  'committed-action': 'Wat is toegewijd handelen in ACT?',
};

const SECTION_QUESTIONS: Record<string, string> = {
  'De vermijdingscirkel': 'Wat is de vermijdingscirkel?',
  'Acceptatie is niet opgeven': 'Wat is het verschil tussen acceptatie en opgeven?',
  'De paradox van controle': 'Wat is de paradox van controle?',
  Ademruimte: 'Hoe werkt de oefening Ademruimte?',
  Bodyscan: 'Hoe werkt de bodyscan-oefening?',
};

const ACT_TOPIC_KEYWORDS = [
  'acceptatie',
  'defusie',
  'defusion',
  'vermijding',
  'vermijden',
  'cirkel',
  'module',
  'oefening',
  'adem',
  'bodyscan',
  'waarden',
  'waarde',
  'act',
  'programma',
  'terugval',
  'pijn',
  'angst',
  'aanwezig',
  'context',
  'handelen',
  'intake',
  'stemming',
  'check-in',
  'checkin',
  'barrière',
  'barriere',
  'actie',
];

const VAGUE_PATTERNS: readonly RegExp[] = [
  /^\s*help\s*[!?.]*\s*$/i,
  /^\s*hulp\s*[!?.]*\s*$/i,
  /^\s*wat nu\s*[!?.]*\s*$/i,
  /^\s*en nu\s*[!?.]*\s*$/i,
  /^\s*ik snap het niet\s*[!?.]*\s*$/i,
  /^\s*snap het niet\s*[!?.]*\s*$/i,
  /^\s*geen idee\s*[!?.]*\s*$/i,
  /^\s*hm+\s*[!?.]*\s*$/i,
  /^\s*\?+\s*$/,
];

const PRONOUN_ONLY = /^\s*(dat|dit|het|daar|hier|zo|waarom)\s*[!?.]*\s*$/i;

const PROGRAM_FALLBACK_OPTIONS = [
  'Wat betekent acceptatie in dit programma?',
  'Wat is de vermijdingscirkel?',
  'Welke oefening helpt bij spanning in mijn lichaam?',
];

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFC').trim();
}

function wordCount(text: string): number {
  return normalize(text).split(/\s+/).filter(Boolean).length;
}

function hasActTopic(text: string): boolean {
  const q = normalize(text);
  return ACT_TOPIC_KEYWORDS.some((kw) => {
    if (kw.includes(' ')) return q.includes(kw);
    return new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(q);
  });
}

function hasProfileTopic(text: string): boolean {
  const q = normalize(text);
  return /\b(stemming|gevoel|emotie|waarden?|check-?in|incheck|profiel|mijn dag)\b/i.test(q);
}

export function isVagueQuestion(
  question: string,
  history: Array<{ role: string; content: string }>,
): boolean {
  const q = question.trim();
  if (!q) return true;
  if (VAGUE_PATTERNS.some((p) => p.test(q))) return true;
  if (PRONOUN_ONLY.test(q) && history.length === 0) return true;
  if (wordCount(q) < 4 && !hasActTopic(q) && !hasProfileTopic(q)) return true;
  if (/^\s*ik voel me\s+\w+\s*[!?.]*\s*$/i.test(q) && !hasActTopic(q)) return true;
  return false;
}

export function isWeakRetrieval(chunks: RetrievalChunk[]): boolean {
  if (chunks.length === 0) return true;
  return (chunks[0]?.rrf_score ?? 0) < MIN_RRF_SCORE;
}

function hasClearWinner(chunks: RetrievalChunk[]): boolean {
  if (chunks.length < 2) return true;
  const first = chunks[0]?.rrf_score ?? 0;
  const second = chunks[1]?.rrf_score ?? 0;
  if (first === 0) return false;
  return first >= second * CLEAR_WINNER_RATIO;
}

function chunkModuleId(chunk: RetrievalChunk): string {
  return String(chunk.metadata.moduleId ?? '').trim();
}

export function isAmbiguousRetrieval(chunks: RetrievalChunk[]): boolean {
  if (chunks.length < 2) return false;
  if (hasClearWinner(chunks)) return false;

  const first = chunks[0];
  const second = chunks[1];
  if (!first || !second) return false;

  const mod1 = chunkModuleId(first);
  const mod2 = chunkModuleId(second);
  if (!mod1 || !mod2 || mod1 === mod2) return false;

  return true;
}

function chunkDedupeKey(chunk: RetrievalChunk): string {
  const sectionId = String(chunk.metadata.sectionId ?? '').trim();
  if (sectionId) return `section:${sectionId}`;
  const title = String(chunk.metadata.sectionTitle ?? '').trim();
  if (title) return `title:${title}`;
  const moduleId = chunkModuleId(chunk);
  if (moduleId) return `module:${moduleId}`;
  return '';
}

function formatChunkAsQuestion(chunk: RetrievalChunk): string {
  const title = String(chunk.metadata.sectionTitle ?? '').trim();
  const moduleId = chunkModuleId(chunk);
  const type = String(chunk.metadata.type ?? '');

  if (title && SECTION_QUESTIONS[title]) return SECTION_QUESTIONS[title];
  if (type === 'body-exercise' && title) return `Hoe werkt de oefening ${title}?`;
  if (title) return `Wat staat er in het programma over ${title}?`;
  if (moduleId && MODULE_QUESTIONS[moduleId]) return MODULE_QUESTIONS[moduleId];
  return PROGRAM_FALLBACK_OPTIONS[0] ?? 'Wat betekent acceptatie in dit programma?';
}

/** Top-N retrieval hits as concrete, clickable questions (ranked by RRF score). */
export function buildTopRetrievalOptions(chunks: RetrievalChunk[], count = OPTION_COUNT): string[] {
  const sorted = [...chunks].sort((a, b) => b.rrf_score - a.rrf_score);
  const options: string[] = [];
  const seen = new Set<string>();

  for (const chunk of sorted) {
    if (options.length >= count) break;
    const key = chunkDedupeKey(chunk);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    options.push(formatChunkAsQuestion(chunk));
  }

  for (const fallback of PROGRAM_FALLBACK_OPTIONS) {
    if (options.length >= count) break;
    if (seen.has(fallback)) continue;
    seen.add(fallback);
    options.push(fallback);
  }

  return options.slice(0, count);
}

function profileOptions(userContext: ChatUserContextData): string[] {
  const options: string[] = [];
  if (userContext.moodLogs.length > 0) {
    options.push('Hoe was mijn stemming de afgelopen dagen?');
  }
  if (userContext.waarden.length > 0) {
    options.push('Wat zijn mijn waarden en acties?');
  }
  if (userContext.checkins.length > 0) {
    options.push('Hoe ging mijn waarden-check-in?');
  }
  return options;
}

/** Clarify chips for vague / mixed-intent questions (profile + retrieval). */
export function buildClarifyOptions(
  question: string,
  chunks: RetrievalChunk[],
  userContext: ChatUserContextData,
): string[] {
  const options: string[] = [];
  const seen = new Set<string>();
  const asked = normalize(question);

  function add(option: string) {
    if (options.length >= OPTION_COUNT) return;
    if (normalize(option) === asked || seen.has(option)) return;
    seen.add(option);
    options.push(option);
  }

  if (chunks.length > 0) {
    for (const o of buildTopRetrievalOptions(chunks, OPTION_COUNT)) add(o);
  }

  for (const o of profileOptions(userContext)) add(o);

  if (!hasActTopic(question) && !hasProfileTopic(question)) {
    if (userContext.moodLogs.length > 0) add('Iets over mijn stemming of check-in');
    if (userContext.waarden.length > 0) add('Iets over mijn waarden');
  }

  for (const o of PROGRAM_FALLBACK_OPTIONS) add(o);

  return options.slice(0, OPTION_COUNT);
}

export function assessClarifyNeed(
  question: string,
  chunks: RetrievalChunk[],
  userContext: ChatUserContextData,
  history: Array<{ role: string; content: string }>,
): ClarifyDecision | null {
  const vague = isVagueQuestion(question, history);
  const ambiguous = isAmbiguousRetrieval(chunks);
  const specificQuestion = hasActTopic(question) && wordCount(question) >= 4;

  if (vague && (chunks.length === 0 || isWeakRetrieval(chunks))) {
    const options =
      chunks.length > 0
        ? buildTopRetrievalOptions(chunks)
        : buildClarifyOptions(question, chunks, userContext);
    return { reason: 'vague_question', options };
  }

  // Only clarify on ambiguous retrieval when the question itself is vague — otherwise answer with top chunk.
  if (ambiguous && vague && chunks.length > 0) {
    return { reason: 'ambiguous_retrieval', options: buildTopRetrievalOptions(chunks) };
  }

  if (chunks.length > 0 && isWeakRetrieval(chunks) && vague) {
    return { reason: 'weak_retrieval', options: buildTopRetrievalOptions(chunks) };
  }

  if (
    hasProfileTopic(question) &&
    hasActTopic(question) &&
    chunks.length > 0 &&
    !specificQuestion
  ) {
    return { reason: 'mixed_intent', options: buildClarifyOptions(question, chunks, userContext) };
  }

  return null;
}
