/**
 * RAG chatbot — search Edge Function.
 *
 * Pipeline per ADR-005:
 *   1. Auth check (Supabase JWT) — anonymous requests rejected.
 *   2. Crisis keyword pre-filter — bypasses embedding + LLM on match.
 *   3. Voyage AI embedding (voyage-3-lite, 512 dims, input_type='query').
 *   4. hybrid_search() RPC — vector + Dutch FTS via RRF, top-5 chunks.
 *   5. Claude Haiku 4.5 call with system prompt + retrieved chunks +
 *      last 3 turns of history (in-memory only on the client).
 *
 * Safety (docs/SECURITY.md → AI processing):
 *   - Request body is never logged. Only error messages reach console.
 *   - Crisis pre-filter is server-side defence-in-depth; the client has
 *     its own check (Phase 3). Either layer alone is sufficient; both
 *     together survive a bypass of the other.
 *   - System prompt and crisis copy mirror docs/THERAPEUT_KB/chatbot-drafts.md
 *     (APPROVED 2026-06-12). When the drafts revision, mirror here.
 *
 * Deploy: scripts/deploy-rag-functions.sh
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

// ── Config ──────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MATCH_COUNT = 5;
const MAX_HISTORY_MESSAGES = 6; // 3 turns × 2 roles
const MAX_QUESTION_LENGTH = 2000;
const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const VOYAGE_MODEL = 'voyage-3-lite';

// ── Dutch copy (mirror of docs/THERAPEUT_KB/chatbot-drafts.md APPROVED v1.0) ─

const SYSTEM_PROMPT_INSTRUCTIONS = `Je bent een rustige, warme gids in de app Van Overleven naar Leven. De app is een zelfstandig therapeutisch programma op basis van Acceptance and Commitment Therapy (ACT) en lichaamsgerichte psychosomatische therapie.

Je rol:
• Je beantwoordt vragen van gebruikers uitsluitend op basis van de informatie uit het programma die hieronder staat onder "INFORMATIE UIT HET PROGRAMMA".
• Je vat die informatie samen in begrijpelijk Nederlands, kort en helder (maximaal 3 alinea's). Geen vakjargon. Geen opsommingen langer dan 5 punten.
• Je toon is rustig, warm, niet klinisch. Je oordeelt niet. Je benadrukt dat klachten geen vijand zijn en dat terugval informatie is, geen mislukking.

Wat je nooit doet:
• Je geeft nooit medisch advies, geen diagnose, geen behandelplan.
• Je verzint nooit oefeningen, technieken of citaten die niet in de informatie staan. Als iets er niet staat, zeg je dat eerlijk.
• Je doet geen uitspraken over medicatie, dosering of het stoppen daarmee.
• Je geeft geen advies bij acute crisis. Bij signalen van suïcidaliteit, zelfbeschadiging, ernstige verslaving zonder begeleiding of acute psychische nood verwijs je de gebruiker direct naar professionele hulp.

Als de vraag buiten het programma valt of als je het antwoord niet in de informatie kunt vinden:

"Dit valt buiten wat ik vanuit het programma kan vertellen. Bespreek het met je huisarts, of bel bij directe nood 0800-0113."

Bij signalen van crisis, ook al zit het niet expliciet in de vraag:

"Het lijkt erop dat je nu veel meemaakt. Dit is een moment voor menselijke hulp, niet voor een app. Bel je huisarts, of bij directe nood 0800-0113 (24/7 bereikbaar)."

Taal: Nederlands. Schrijfstijl: rustig, in jij-vorm, geen uitroeptekens. Geen streepjes als zinsbreuk; gebruik een punt, komma of dubbele punt.`;

const CRISIS_RESPONSE =
  'Het lijkt erop dat je nu veel meemaakt. Dit is een moment voor menselijke hulp, niet voor een app. Bel je huisarts, of bij directe nood 0800-0113 (24/7 bereikbaar).';

const OUT_OF_SCOPE_RESPONSE =
  'Dit valt buiten wat ik vanuit het programma kan vertellen. Bespreek het met je huisarts, of bel bij directe nood 0800-0113.';

const ERROR_GENERIC = 'Er ging iets mis. Probeer het opnieuw.';
const ERROR_UNAUTHORIZED = 'Niet ingelogd.';
const ERROR_BAD_REQUEST = 'Ongeldig verzoek.';
const ERROR_QUESTION_REQUIRED = 'Vraag is verplicht.';
const ERROR_QUESTION_TOO_LONG = 'Vraag is te lang.';

// ── Crisis keyword pre-filter ───────────────────────────────────────────────
// Mirror of chatbot-drafts.md § 2 hard triggers. When this list changes,
// update the client-side chat-safety.ts in the same PR.

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

const CRISIS_PATTERNS: readonly RegExp[] = CRISIS_KEYWORDS.map(
  (kw) => new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i'),
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsCrisisSignal(text: string): boolean {
  const normalized = text.toLowerCase().normalize('NFC');
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
}

// ── Input validation ────────────────────────────────────────────────────────

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type ValidatedInput = {
  question: string;
  history: ChatMessage[];
  filterCategory: string | null;
  filterPhase: number | null;
};

function validateInput(body: unknown): ValidatedInput | { error: string } {
  if (typeof body !== 'object' || body === null) return { error: ERROR_BAD_REQUEST };

  const b = body as Record<string, unknown>;

  if (typeof b.question !== 'string' || !b.question.trim()) {
    return { error: ERROR_QUESTION_REQUIRED };
  }
  if (b.question.length > MAX_QUESTION_LENGTH) {
    return { error: ERROR_QUESTION_TOO_LONG };
  }

  const history: ChatMessage[] = [];
  if (Array.isArray(b.history)) {
    for (const entry of b.history.slice(-MAX_HISTORY_MESSAGES)) {
      if (
        typeof entry === 'object' &&
        entry !== null &&
        (entry as { role?: unknown }).role !== undefined &&
        typeof (entry as { content?: unknown }).content === 'string'
      ) {
        const role = (entry as { role: unknown }).role;
        if (role === 'user' || role === 'assistant') {
          history.push({ role, content: (entry as { content: string }).content });
        }
      }
    }
  }

  const filterCategory =
    typeof b.filterCategory === 'string' && b.filterCategory.trim() ? b.filterCategory : null;
  const filterPhase = typeof b.filterPhase === 'number' && Number.isFinite(b.filterPhase)
    ? b.filterPhase
    : null;

  return { question: b.question.trim(), history, filterCategory, filterPhase };
}

// ── Voyage AI embedding ─────────────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('VOYAGE_API_KEY');
  if (!apiKey) throw new Error('VOYAGE_API_KEY not configured');

  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [text],
      model: VOYAGE_MODEL,
      input_type: 'query',
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage API ${res.status}`);
  }

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  const embedding = data.data[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error('Voyage: empty embedding');
  return embedding;
}

// ── hybrid_search RPC ───────────────────────────────────────────────────────

type Chunk = {
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, unknown>;
  rrf_score: number;
};

async function hybridSearch(
  supabase: SupabaseClient,
  queryText: string,
  queryEmbedding: number[],
  filterCategory: string | null,
  filterPhase: number | null,
): Promise<Chunk[]> {
  const { data, error } = await supabase.rpc('hybrid_search', {
    query_text: queryText,
    query_embedding: queryEmbedding,
    match_count: MATCH_COUNT,
    filter_category: filterCategory,
    filter_phase: filterPhase,
  });

  if (error) throw new Error(`hybrid_search: ${error.message}`);
  return (data ?? []) as Chunk[];
}

// ── Claude Haiku call ───────────────────────────────────────────────────────

async function askClaude(
  question: string,
  chunks: Chunk[],
  history: ChatMessage[],
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const context = chunks.map((c, i) => `[Bron ${i + 1}]\n${c.content}`).join('\n\n---\n\n');

  const systemPrompt = `${SYSTEM_PROMPT_INSTRUCTIONS}\n\nINFORMATIE UIT HET PROGRAMMA:\n\n${context}`;

  const messages = [...history.slice(-MAX_HISTORY_MESSAGES), { role: 'user', content: question }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}`);
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
  const text = data.content.find((c) => c.type === 'text')?.text;
  if (!text) throw new Error('Anthropic: empty completion');
  return text;
}

// ── Response helpers ────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: ERROR_BAD_REQUEST }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: ERROR_UNAUTHORIZED }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonResponse({ error: ERROR_UNAUTHORIZED }, 401);

    let parsed: unknown;
    try {
      parsed = await req.json();
    } catch {
      return jsonResponse({ error: ERROR_BAD_REQUEST }, 400);
    }

    const validated = validateInput(parsed);
    if ('error' in validated) return jsonResponse({ error: validated.error }, 400);

    const { question, history, filterCategory, filterPhase } = validated;

    if (containsCrisisSignal(question)) {
      return jsonResponse({
        answer: CRISIS_RESPONSE,
        crisis: true,
        chunksFound: 0,
      });
    }

    const embedding = await getEmbedding(question);
    const chunks = await hybridSearch(
      supabase,
      question,
      embedding,
      filterCategory,
      filterPhase,
    );

    if (chunks.length === 0) {
      return jsonResponse({
        answer: OUT_OF_SCOPE_RESPONSE,
        chunksFound: 0,
      });
    }

    const answer = await askClaude(question, chunks, history);

    return jsonResponse({
      answer,
      chunksFound: chunks.length,
    });
  } catch (err) {
    // Do NOT log request body — only the error message reaches console.
    console.error('search:', err instanceof Error ? err.message : String(err));
    return jsonResponse({ error: ERROR_GENERIC }, 500);
  }
});
