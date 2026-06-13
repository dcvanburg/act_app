/**
 * First-turn greeting detection and formatting for the RAG chatbot.
 * Mirror in supabase/functions/search/greeting.ts — keep both in sync.
 */

import chat from '@/content/nl/chat.json';

const GREETING_WORDS = [
  'hallo',
  'hoi',
  'hey',
  'ha',
  'hoihoi',
  'hallootje',
  'goedemorgen',
  'goedemiddag',
  'goedenavond',
  'goedenacht',
  'goedendag',
  'dag',
] as const;

const GREETING_FILLERS = new Set(['daar', 'jij', 'je', 'allemaal', 'weer']);

const GREETING_PREFIX_RE = new RegExp(
  `^(${GREETING_WORDS.join('|')})(?:\\s+${[...GREETING_FILLERS].join('|')})*\\s*[!.,?]*\\s*`,
  'i',
);

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFC').trim();
}

function greetingWordsIn(text: string): string[] {
  const stripped = normalize(text).replace(/[!?.,]+/g, ' ');
  return stripped.split(/\s+/).filter(Boolean);
}

/** True when the message is only a greeting (no question or topic). */
export function isGreetingOnly(text: string): boolean {
  const words = greetingWordsIn(text);
  if (words.length === 0) return false;
  const allowed = new Set<string>([...GREETING_WORDS, ...GREETING_FILLERS]);
  return words.every((w) => allowed.has(w));
}

/** True when the message starts with a Dutch greeting. */
export function hasGreetingPrefix(text: string): boolean {
  return GREETING_PREFIX_RE.test(text.trim());
}

/** Remove a leading greeting so retrieval focuses on the actual question. */
export function stripGreetingPrefix(text: string): string {
  const trimmed = text.trim();
  const withoutGreeting = trimmed.replace(GREETING_PREFIX_RE, '').trim();
  return withoutGreeting.length > 0 ? withoutGreeting : trimmed;
}

function applyName(template: string, firstName: string | null): string {
  const name = firstName?.trim();
  if (name) return template.replace('{name}', name);
  return template.replace('{name}', '').replace(/\s{2,}/g, ' ').trim();
}

/** Reply when the user only greets on the first turn. */
export function formatGreetingOnlyReply(firstName: string | null): string {
  const template = firstName?.trim()
    ? chat.greeting.onlyWithName
    : chat.greeting.onlyWithoutName;
  return applyName(template, firstName);
}

/** Prefix prepended to the first substantive answer. */
export function formatGreetingPrefix(firstName: string | null): string {
  const template = firstName?.trim()
    ? chat.greeting.prefixWithName
    : chat.greeting.prefixWithoutName;
  return applyName(template, firstName);
}

/** Prepend a first-turn greeting when the answer does not already start with one. */
export function prependFirstTurnGreeting(answer: string, firstName: string | null): string {
  const trimmed = answer.trim();
  if (!trimmed || hasGreetingPrefix(trimmed)) return trimmed;
  return `${formatGreetingPrefix(firstName)}${trimmed}`;
}

/** Strip bullet / numbered option lines from a clarify prompt (options live in chips). */
export function stripClarifyBulletOptions(text: string): string {
  const lines = text.split('\n');
  const kept = lines.filter((line) => !/^\s*(?:[•\-*]|\d+[.)])\s+/.test(line));
  return kept.join('\n').trim();
}
