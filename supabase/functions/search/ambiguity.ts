/**
 * Retrieval confidence + clarify options (mirror of src/lib/chat-ambiguity.ts).
 */

import type { ChatUserContextData } from './user-context.ts';

export type RetrievalChunk = {
  metadata: Record<string, unknown>;
  rrf_score: number;
};

export type ClarifyDecision = {
  reason: 'vague_question' | 'weak_retrieval' | 'ambiguous_retrieval' | 'mixed_intent';
  options: string[];
};

const MIN_RRF_SCORE = 0.012;
const CLEAR_WINNER_RATIO = 1.12;
const OPTION_COUNT = 3;

const MODULE_QUESTIONS: Record<string, string> = {
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
  /^\s*ik weet het niet\s*[!?.]*\s*$/i,
  /^\s*ik weet het echt niet\s*[!?.]*\s*$/i,
  /^\s*weet ik het niet\s*[!?.]*\s*$/i,
  /^\s*hm+\s*[!?.]*\s*$/i,
  /^\s*\?+\s*$/,
];

const PRONOUN_ONLY = /^\s*(dat|dit|het|daar|hier|zo|waarom)\s*[!?.]*\s*$/i;

const PROGRAM_FALLBACK_OPTIONS = [
  'Wat betekent acceptatie in dit programma?',
  'Wat is de vermijdingscirkel?',
  'Welke oefening helpt bij spanning in mijn lichaam?',
];

export const CLARIFY_PROMPTS: Record<ClarifyDecision['reason'], string> = {
  vague_question:
    'Ik wil je goed helpen, maar ik weet nog niet precies wat je bedoelt. Kies hieronder wat het dichtst in de buurt komt, of typ je vraag specifieker.',
  weak_retrieval:
    'Ik vind geen duidelijke match in het programma bij je vraag. Kies een van deze onderwerpen, of typ je vraag specifieker.',
  ambiguous_retrieval:
    'Je vraag past bij meerdere onderwerpen. Kies het onderwerp waar je meer over wilt weten:',
  mixed_intent:
    'Even checken: waar wil je meer over weten? Kies een van deze opties:',
};

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

function isVagueQuestion(
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

export function uncertaintyStreak(
  question: string,
  history: Array<{ role: string; content: string }>,
): number {
  let streak = isVagueQuestion(question, history) ? 1 : 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role !== 'user') continue;
    if (isVagueQuestion(msg.content, history.slice(0, i))) streak++;
    else break;
  }
  return streak;
}

export const UNCERTAINTY_LOOP_RESPONSE =
  'Het is oké als je het nu even niet weet. Kies een onderwerp hieronder, of beschrijf in je eigen woorden waar je mee zit.';

const CLARIFY_FOLLOW_UP_MARKERS = [
  'Kies hieronder',
  'Kies een van deze',
  'Kies het onderwerp',
  'Kies een onderwerp',
  'typ je vraag specifieker',
  'Even checken',
] as const;

export function isValidClarifyOption(option: string): boolean {
  const trimmed = option.trim();
  if (!trimmed) return false;
  if (isVagueQuestion(trimmed, [])) return false;
  if (/^\s*(ja|nee|misschien|onbekend)\s*[!?.]*\s*$/i.test(trimmed)) return false;
  return true;
}

export function sanitizeClarifyOptions(
  options: string[],
  question: string,
  chunks: RetrievalChunk[],
  userContext: ChatUserContextData,
  count = OPTION_COUNT,
): string[] {
  const valid: string[] = [];
  const seen = new Set<string>();

  function add(option: string) {
    if (valid.length >= count) return;
    const trimmed = option.trim();
    if (!isValidClarifyOption(trimmed)) return;
    const key = normalize(trimmed);
    if (seen.has(key)) return;
    seen.add(key);
    valid.push(trimmed);
  }

  for (const option of options) add(option);

  if (valid.length < 2 && chunks.length > 0) {
    for (const option of buildTopRetrievalOptions(chunks, count)) add(option);
  }

  if (valid.length < 2) {
    for (const option of buildClarifyOptions(question, chunks, userContext)) add(option);
  }

  for (const option of PROGRAM_FALLBACK_OPTIONS) add(option);

  return valid.slice(0, count);
}

export function isClarifyFollowUp(
  question: string,
  history: Array<{ role: string; content: string }>,
): boolean {
  if (!isVagueQuestion(question, history)) return false;
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
  if (!lastAssistant) return false;
  const text = lastAssistant.content.trim();
  if (text === UNCERTAINTY_LOOP_RESPONSE) return true;
  return CLARIFY_FOLLOW_UP_MARKERS.some((marker) => text.includes(marker));
}

function isWeakRetrieval(chunks: RetrievalChunk[]): boolean {
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

function isAmbiguousRetrieval(chunks: RetrievalChunk[]): boolean {
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
  if (userContext.moodLogs.length > 0) options.push('Hoe was mijn stemming de afgelopen dagen?');
  if (userContext.waarden.length > 0) options.push('Wat zijn mijn waarden en acties?');
  if (userContext.checkins.length > 0) options.push('Hoe ging mijn waarden-check-in?');
  return options;
}

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

export type StructuredReply = {
  type: 'answer' | 'clarify' | 'out_of_scope';
  text: string;
  options?: string[];
};
