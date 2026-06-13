/**
 * Client-side crisis-signal pre-filter for the RAG chatbot (ADR-005).
 *
 * Runs BEFORE any network call. On a match the UI shows the crisis card from
 * chat.json and the user is offered a route to /noodhulp — the LLM and the
 * Edge Function are never invoked.
 *
 * The Edge Function (supabase/functions/search/index.ts) holds an identical
 * list for defence-in-depth: either layer alone is sufficient, both together
 * survive a bypass of the other. When this list changes, update the server
 * copy in the same PR.
 *
 * Source of truth for the keyword list:
 *   docs/THERAPEUT_KB/chatbot-drafts.md § 2  (APPROVED v1.0, 2026-06-12)
 */

const CRISIS_KEYWORDS: readonly string[] = [
  'zelfmoord',
  'suïcide',
  'suicide',
  'zelfbeschadiging',
  'zelfverwonding',
  'zelfverminking',
  'mezelf iets aandoen',
  'mezelf pijn doen',
  'mezelf snijden',
  'mezelf verwonden',
  'mezelf van het leven beroven',
  'niet meer willen leven',
  'wil niet meer leven',
  'wil niet meer',
  'wil dood',
  'ik wil dood',
  'einde maken',
  'ermee ophouden',
  'een einde aan mijn leven',
  'overdosis nemen',
  'overdosis genomen',
  'geen reden meer om te leven',
  'geen zin meer in leven',
  'geen zin meer in het leven',
  'ik kan niet meer',
  'ik red het niet',
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CRISIS_PATTERNS: readonly RegExp[] = CRISIS_KEYWORDS.map(
  (kw) => new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i'),
);

/**
 * Returns true when the message contains a Dutch crisis signal.
 * Word-boundary regex prevents single-word false positives like "doodmoe"
 * triggering on "dood". Multi-word phrases catch the ambiguous singles.
 */
export function containsCrisisSignal(text: string): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase().normalize('NFC');
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Exposed for the unit tests. Not part of the public API. */
export const __CRISIS_KEYWORDS = CRISIS_KEYWORDS;
