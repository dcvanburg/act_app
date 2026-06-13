/**
 * Suggests program questions when RAG retrieval finds no matching chunks.
 * Used client-side when search returns noMatch:true (ADR-005 Phase 4).
 */

import chat from '@/content/nl/chat.json';

const TOPIC_RULES: ReadonlyArray<{ keywords: readonly string[]; question: string }> = [
  {
    keywords: ['acceptatie', 'accepteren', 'opgeven', 'berusting'],
    question: 'Wat betekent acceptatie in dit programma?',
  },
  {
    keywords: ['defusie', 'defusion', 'gedachte', 'gedachten', 'hoofd'],
    question: 'Wat is defusie en hoe werkt het in dit programma?',
  },
  {
    keywords: ['pijn', 'spanning', 'lichaam', 'adem', 'bodyscan', 'oefening'],
    question: 'Welke oefening helpt bij spanning in mijn lichaam?',
  },
  {
    keywords: ['vermijd', 'vermijding', 'cirkel', 'vastloop', 'vastlopen'],
    question: 'Wat is de vermijdingscirkel?',
  },
  {
    keywords: ['waarde', 'waarden', 'richting', 'doel', 'kompas'],
    question: 'Hoe werk ik met mijn waarden in dit programma?',
  },
  {
    keywords: ['terugval', 'mislukt', 'opnieuw', 'fout'],
    question: 'Hoe gaat dit programma om met terugval?',
  },
  {
    keywords: ['module', 'verder', 'volgende', 'stap'],
    question: 'Wat doe ik als ik vastloop in een module?',
  },
  {
    keywords: ['aanwezig', 'nu', 'moment', 'aandacht'],
    question: 'Wat betekent aanwezig zijn in dit programma?',
  },
  {
    keywords: ['zelf', 'context', 'ik-ben'],
    question: 'Wat is zelf-als-context?',
  },
  {
    keywords: ['handelen', 'actie', 'stap zetten'],
    question: 'Wat is toegewijd handelen in ACT?',
  },
  {
    keywords: ['stemming', 'stem', 'gevoel', 'voel', 'check-in', 'checkin', 'emotie'],
    question: 'Hoe was mijn stemming de afgelopen dagen?',
  },
  {
    keywords: ['mijn waarde', 'mijn waarden', 'ingevuld', 'doel', 'doelen', 'actieplan'],
    question: 'Wat zijn mijn waarden en acties?',
  },
  {
    keywords: ['ingecheckt', 'waarden-check', 'waardencheck'],
    question: 'Hoe ging mijn waarden-check-in?',
  },
];

const DEFAULT_SUGGESTIONS = chat.suggestedQuestions;

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFC');
}

function matchesKeyword(question: string, keyword: string): boolean {
  const q = normalize(question);
  const k = normalize(keyword);
  if (k.includes(' ')) return q.includes(k);
  const pattern = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return pattern.test(q);
}

/**
 * Picks up to `limit` suggested questions based on keywords in the user's
 * question. Falls back to chat.json suggestedQuestions, excluding the
 * question the user already asked.
 */
export function pickChatSuggestions(question: string, limit = 3): string[] {
  const asked = normalize(question.trim());
  const picked: string[] = [];
  const seen = new Set<string>();

  for (const rule of TOPIC_RULES) {
    if (picked.length >= limit) break;
    const hit = rule.keywords.some((kw) => matchesKeyword(question, kw));
    if (!hit) continue;
    if (normalize(rule.question) === asked || seen.has(rule.question)) continue;
    picked.push(rule.question);
    seen.add(rule.question);
  }

  for (const fallback of DEFAULT_SUGGESTIONS) {
    if (picked.length >= limit) break;
    if (normalize(fallback) === asked || seen.has(fallback)) continue;
    picked.push(fallback);
    seen.add(fallback);
  }

  return picked.slice(0, limit);
}
