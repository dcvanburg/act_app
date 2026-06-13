/**
 * Ensures Dutch chatbot questions end with a question mark.
 * Mirror in supabase/functions/search/punctuation.ts — keep both in sync.
 */

const QUESTION_START_RE =
  /^(wat|welke|wie|waar|wanneer|waarom|hoe|kan|kun|wil|zou|heb|is|zijn|gaat|bedoel|meen|snap|weet)\b/i;

const QUESTION_PHRASE_RE =
  /\b(wil je|kun je|kan je|bedoel je|meen je|wat bedoel je|waar wil je|waar gaat|hoe kan ik|of bedoel je|snap je wat)\b/i;

function lastSentence(text: string): string {
  const parts = text.trim().split(/(?<=[.!?:])\s+/);
  return parts[parts.length - 1] ?? text;
}

function looksLikeQuestion(sentence: string): boolean {
  const trimmed = sentence.trim();
  if (!trimmed || trimmed.endsWith('?')) return false;

  const lower = trimmed.toLowerCase();
  if (QUESTION_START_RE.test(lower)) return true;
  if (QUESTION_PHRASE_RE.test(lower)) return true;

  return false;
}

function fixSentence(sentence: string): string {
  const trimmed = sentence.trim();
  if (!trimmed || trimmed.endsWith('?') || !looksLikeQuestion(trimmed)) {
    return trimmed;
  }

  return `${trimmed.replace(/[.:]+$/, '')}?`;
}

/** Append or replace trailing punctuation so question sentences end with "?". */
export function ensureQuestionMarks(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed.split(/(?<=[.!?:])\s+/);
  if (parts.length === 1) {
    return fixSentence(trimmed);
  }

  const last = parts[parts.length - 1] ?? '';
  if (!looksLikeQuestion(last)) {
    return trimmed;
  }

  parts[parts.length - 1] = fixSentence(last);
  return parts.join(' ');
}

/** True when the message ends with (or is) a question missing "?". */
export function needsQuestionMark(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.endsWith('?')) return false;
  return looksLikeQuestion(lastSentence(trimmed));
}
