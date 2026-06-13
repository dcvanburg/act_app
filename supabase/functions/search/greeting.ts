/**
 * First-turn greeting detection and formatting (mirror of src/lib/chat-greeting.ts).
 */

const GREETING_ONLY_WITH_NAME = 'Hoi {name}, fijn dat je er bent.';
const GREETING_ONLY_WITHOUT_NAME = 'Hoi, fijn dat je er bent.';
const GREETING_PREFIX_WITH_NAME = 'Hoi {name}, ';
const GREETING_PREFIX_WITHOUT_NAME = 'Hoi, ';

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

export function isGreetingOnly(text: string): boolean {
  const words = greetingWordsIn(text);
  if (words.length === 0) return false;
  const allowed = new Set<string>([...GREETING_WORDS, ...GREETING_FILLERS]);
  return words.every((w) => allowed.has(w));
}

export function hasGreetingPrefix(text: string): boolean {
  return GREETING_PREFIX_RE.test(text.trim());
}

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

export function formatGreetingOnlyReply(firstName: string | null): string {
  const template = firstName?.trim() ? GREETING_ONLY_WITH_NAME : GREETING_ONLY_WITHOUT_NAME;
  return applyName(template, firstName);
}

export function formatGreetingPrefix(firstName: string | null): string {
  const template = firstName?.trim() ? GREETING_PREFIX_WITH_NAME : GREETING_PREFIX_WITHOUT_NAME;
  return applyName(template, firstName);
}

export function prependFirstTurnGreeting(answer: string, firstName: string | null): string {
  const trimmed = answer.trim();
  if (!trimmed || hasGreetingPrefix(trimmed)) return trimmed;
  return `${formatGreetingPrefix(firstName)}${trimmed}`;
}

export function stripClarifyBulletOptions(text: string): string {
  const lines = text.split('\n');
  const kept = lines.filter((line) => !/^\s*(?:[•\-*]|\d+[.)])\s+/.test(line));
  return kept.join('\n').trim();
}
