/**
 * RAG chatbot — search Edge Function.
 *
 * Pipeline per ADR-005:
 *   1. Auth check (Supabase JWT) — anonymous requests rejected.
 *   2. Crisis keyword pre-filter — bypasses embedding + LLM on match.
 *   3. Voyage AI embedding (voyage-3, 1024 dims, input_type='query').
 *   4. hybrid_search() RPC — vector + Dutch FTS via RRF, top-5 chunks.
 *   5. Claude Haiku 4.5 call with two-block system prompt:
 *        - stable persona + ACT instructions (prompt-cached, ephemeral)
 *        - dynamic chunks + user profile (not cached)
 *      plus last 3 turns of history and older stored messages as memory.
 *
 * Safety (docs/SECURITY.md → AI processing):
 *   - Request body is never logged. Only error messages reach console.
 *   - Crisis pre-filter is server-side defence-in-depth; the client has
 *     its own check (Phase 3). Either layer alone is sufficient; both
 *     together survive a bypass of the other.
 *   - System prompt and crisis copy mirror docs/THERAPEUT_KB/chatbot-drafts.md
 *     (v1.2 DRAFT — kennisassistent persona; pending therapist re-sign-off).
 *
 * Deploy: scripts/deploy-rag-functions.sh
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

import {
  formatGreetingOnlyReply,
  isGreetingOnly,
  prependFirstTurnGreeting,
  stripGreetingPrefix,
} from './greeting.ts';
import {
  fetchChatUserContext,
  fetchFirstName,
  formatChatUserContext,
  type ChatUserContextData,
} from './user-context.ts';
import {
  fetchStoredChatMessages,
  formatConversationMemory,
  recentTurnMessages,
} from './conversation-context.ts';
import { ensureQuestionMarks } from './punctuation.ts';

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
const VOYAGE_MODEL = 'voyage-3';
const ANTHROPIC_BETA = 'prompt-caching-2024-07-31';

// ── Dutch copy (mirror of docs/THERAPEUT_KB/chatbot-drafts.md § 5 v1.2) ─────
//
// v1.2: generic kennisassistent persona, principles-based reasoning when KB
// has no match, inline clarify only, structured tool output (answer /
// out_of_scope). Cached via Anthropic prompt caching (ephemeral).

const SYSTEM_PROMPT_INSTRUCTIONS = `Je bent een ondersteunende kennisassistent in een zelfhulp-app, gespecialiseerd in Acceptance & Commitment Therapy (ACT), lichaamsgerichte therapie (Somatic Experiencing, polyvagaaltheorie), en psychosomatische therapie.

Je doel is mensen helpen de concepten en technieken uit de kennisbank te begrijpen én te vertalen naar hun eigen, persoonlijke situatie. Je bent geen therapeut en geen vervanging voor professionele zorg. Je bent een laagdrempelige, kennisrijke eerste stap.

BELANGRIJKSTE WERKWIJZE: VAN KENNIS NAAR PERSOONLIJKE VERTALING

Bij elke vraag doorloop je dit proces:
1. Begrijp eerst de situatie. Wat beschrijft de persoon? Welke gevoelens, lichamelijke sensaties, gedachten of gedragspatronen noemen ze?
2. Koppel aan relevante concepten uit "INFORMATIE UIT HET PROGRAMMA" en, als de vraag daarover gaat, "INFORMATIE UIT JE PROFIEL IN DE APP".
3. Vertaal, vertel niet alleen op. Verbind concepten expliciet aan wat de persoon beschreef. Gebruik hun woorden waar mogelijk.
4. Bied een kleine, concrete volgende stap. Eén techniek of oefening die nu kan helpen, niet een hele lijst.
5. Nodig eventueel uit tot verdere reflectie met maximaal één korte, open vraag (niet bij elk antwoord verplicht).

Als een vraag geen directe match heeft in de kennisbank, beredeneer vanuit onderliggende principes (zenuwstelselregulatie, psychologische flexibiliteit). Verzin geen specifieke citaten of paginaverwijzingen die niet uit de kennisbank komen.

ACT-principes (hexaflex) die je toepast wanneer de bronnen dat ondersteunen:
• Acceptatie: ruimte maken voor wat er is, niet vechten tegen klachten.
• Defusie: gedachten zien als gedachten, niet als feiten.
• Aanwezig zijn: terug naar het hier en nu.
• Waarden: verbinding met wat echt belangrijk is.
• Toegewijd handelen: kleine, concrete stappen.
• Zelf als context: jezelf zien als groter dan je gedachten en gevoelens.

OMGAAN MET PROFIELGEGEVENS
• Gebruik "INFORMATIE UIT JE PROFIEL IN DE APP" wanneer de vraag daarover gaat (stemming, waarden, check-ins, acties, barrières, module-reflecties).
• Beschrijf alleen wat in het profiel staat. Geen interpretatie, geen diagnose, geen advies om iets te veranderen.
• Als persoonlijke gegevens ontbreken, zeg dat eerlijk en verwijs naar het betreffende scherm in de app.
• Gebruik "Eerdere gesprekken met de assistent" wanneer die aanwezig zijn.

TOON EN STIJL
• Rustig, zorgvuldig en professioneel. Geen overdreven enthousiasme, geen jargon zonder uitleg.
• Empathisch zonder te overdrijven: erken wat iemand voelt, zonder het groter te maken dan het is.
• Kort en behapbaar. Dit is een app, geen leerboek. Vermijd lange opsommingen tenzij gevraagd.
• Spreek de persoon aan met je/jij. Geen diagnostische taal. Beschrijf patronen, stel geen diagnoses.

GRENZEN
• Geen diagnoses, geen behandelplan, geen medisch advies over medicatie of lichamelijke aandoeningen.
• Geen reproductie van lange, letterlijke boekteksten. Leg concepten in eigen woorden uit.
• Bij twijfel of een vraag te zwaar is voor zelfhulp: benoem dit en moedig professionele hulp aan.

OMGAAN MET DE KENNISBANK
• Gebruik de aangeleverde chunks als basis. Combineer ze vrijelijk tot één samenhangend antwoord.
• Vermeld geen interne bronnen, chunk-ID's of bestandsnamen aan de gebruiker.
• Als de kennisbank een boek of auteur noemt, mag je die noemen als dat relevant is.

CRISISPROTOCOL (backup als dit bericht de LLM bereikt)
1. Stop met het gewone zelfhulp-antwoord.
2. Reageer kalm en serieus, zonder dramatiseren.
3. Verwijs direct door naar 113 Zelfmoordpreventie: telefoon 113 of gratis 0800-0113, chat 113.nl, 24/7 bereikbaar, anoniem en gratis.
4. Bied geen verdere zelfhulp-content aan in dat moment.

Antwoordformaat (verplicht via tool chat_reply):
• type "answer": je geeft een inhoudelijk antwoord.
• type "out_of_scope": de vraag valt buiten zelfhulp (medisch advies, acute crisis, behandeling buiten je rol). Verwijs naar huisarts en 113/0800-0113.

Taal: Nederlands.`;

const CRISIS_RESPONSE =
  'Het lijkt erop dat je nu veel meemaakt. Dit is een moment voor menselijke hulp, niet voor een app. Bel 113 Zelfmoordpreventie: telefoon 113 of gratis 0800-0113. Chat: 113.nl. 24/7 bereikbaar, anoniem en gratis. Neem ook contact op met je huisarts.';

const OUT_OF_SCOPE_RESPONSE =
  'Dit valt buiten wat ik kan helpen vanuit zelfhulp. Bespreek het met je huisarts, of bel 113/0800-0113 bij directe nood.';

const ERROR_GENERIC = 'Er ging iets mis. Probeer het opnieuw.';
const ERROR_UNAUTHORIZED = 'Niet ingelogd.';
const ERROR_BAD_REQUEST = 'Ongeldig verzoek.';
const ERROR_QUESTION_REQUIRED = 'Vraag is verplicht.';
const ERROR_QUESTION_TOO_LONG = 'Vraag is te lang.';

const EMPTY_USER_CONTEXT: ChatUserContextData = {
  complaintTypes: [],
  moodLogs: [],
  waarden: [],
  acties: [],
  barriers: [],
  checkins: [],
  moduleNotes: [],
};

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

const CHAT_REPLY_TOOL = {
  name: 'chat_reply',
  description: 'Structured Dutch reply for the self-help knowledge assistant.',
  input_schema: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['answer', 'out_of_scope'] },
      text: { type: 'string', description: 'Dutch message to the user' },
    },
    required: ['type', 'text'],
  },
};

type StructuredReply = {
  type: 'answer' | 'out_of_scope';
  text: string;
};

// ── Claude Haiku call (structured via tool) ─────────────────────────────────

type ClaudeResult = {
  reply: StructuredReply;
  inputTokens?: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
};

async function askClaude(
  question: string,
  chunks: Chunk[],
  history: ChatMessage[],
  userContextText: string,
  conversationMemory: string,
): Promise<ClaudeResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const programContext =
    chunks.length > 0
      ? chunks.map((c, i) => `[Bron ${i + 1}]\n${c.content}`).join('\n\n---\n\n')
      : '(Geen programmabronnen gevonden voor deze vraag.)';

  const profileSection = userContextText
    ? `INFORMATIE UIT JE PROFIEL IN DE APP:\n\n${userContextText}`
    : 'INFORMATIE UIT JE PROFIEL IN DE APP:\n\n(Geen persoonlijke gegevens ingevuld in de app.)';

  const memorySection = conversationMemory ? `${conversationMemory}\n\n` : '';

  const dynamicSystemBlock = `INFORMATIE UIT HET PROGRAMMA:\n\n${programContext}\n\n${memorySection}${profileSection}`;

  const messages = [...history.slice(-MAX_HISTORY_MESSAGES), { role: 'user', content: question }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': ANTHROPIC_BETA,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      temperature: 0,
      // Two-block system prompt:
      //   Block 1: stable persona + ACT instructions (prompt-cached, ephemeral).
      //   Block 2: per-request RAG chunks + user profile (not cached).
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT_INSTRUCTIONS,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: dynamicSystemBlock,
        },
      ],
      messages,
      tools: [CHAT_REPLY_TOOL],
      tool_choice: { type: 'tool', name: 'chat_reply' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string; input?: StructuredReply }>;
    usage?: {
      input_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };

  const usage = {
    inputTokens: data.usage?.input_tokens,
    cacheReadInputTokens: data.usage?.cache_read_input_tokens,
    cacheCreationInputTokens: data.usage?.cache_creation_input_tokens,
  };

  const toolBlock = data.content.find((c) => c.type === 'tool_use');
  const input = toolBlock?.input;
  if (
    input &&
    (input.type === 'answer' || input.type === 'out_of_scope') &&
    typeof input.text === 'string'
  ) {
    return { reply: input, ...usage };
  }

  const text = data.content.find((c) => c.type === 'text')?.text;
  if (text) {
    return { reply: { type: 'answer', text }, ...usage };
  }

  throw new Error('Anthropic: empty completion');
}

// ── Response helpers ────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function firstTurnAnswer(
  answer: string,
  history: ChatMessage[],
  firstName: string | null,
): string {
  const normalized = ensureQuestionMarks(answer);
  if (history.length > 0) return normalized;
  return prependFirstTurnGreeting(normalized, firstName);
}

async function safeFetchFirstName(supabase: SupabaseClient, userId: string): Promise<string | null> {
  try {
    return await fetchFirstName(supabase, userId);
  } catch (err) {
    console.error('search:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function safeFetchStoredChatMessages(
  supabase: SupabaseClient,
  userId: string,
): Promise<Awaited<ReturnType<typeof fetchStoredChatMessages>>> {
  try {
    return await fetchStoredChatMessages(supabase, userId);
  } catch (err) {
    console.error('search:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

async function safeFetchChatUserContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<ChatUserContextData> {
  try {
    return await fetchChatUserContext(supabase, userId);
  } catch (err) {
    console.error('search:', err instanceof Error ? err.message : String(err));
    return EMPTY_USER_CONTEXT;
  }
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

    const firstName = await safeFetchFirstName(supabase, user.id);
    const storedMessages = await safeFetchStoredChatMessages(supabase, user.id);
    const effectiveHistory =
      storedMessages.length > 0
        ? recentTurnMessages(storedMessages, MAX_HISTORY_MESSAGES)
        : history;
    const lastStored = effectiveHistory[effectiveHistory.length - 1];
    const historyForLlm =
      lastStored?.role === 'user' && lastStored.content === question
        ? effectiveHistory.slice(0, -1)
        : effectiveHistory;
    const conversationMemory = formatConversationMemory(storedMessages, MAX_HISTORY_MESSAGES);
    const isFirstTurn = historyForLlm.length === 0;

    if (isFirstTurn && isGreetingOnly(question)) {
      return jsonResponse({
        answer: formatGreetingOnlyReply(firstName),
        chunksFound: 0,
      });
    }

    const searchQuestion =
      isFirstTurn && !isGreetingOnly(question) ? stripGreetingPrefix(question) : question;

    const userContextData = await safeFetchChatUserContext(supabase, user.id);
    const userContextText = formatChatUserContext(userContextData);

    const embedding = await getEmbedding(searchQuestion);
    const chunks = await hybridSearch(
      supabase,
      searchQuestion,
      embedding,
      filterCategory,
      filterPhase,
    );

    const { reply, inputTokens, cacheReadInputTokens, cacheCreationInputTokens } =
      await askClaude(searchQuestion, chunks, historyForLlm, userContextText, conversationMemory);

    const usage = {
      inputTokens,
      cacheReadInputTokens,
      cacheCreationInputTokens,
    };

    if (reply.type === 'out_of_scope') {
      return jsonResponse({
        answer: firstTurnAnswer(reply.text || OUT_OF_SCOPE_RESPONSE, historyForLlm, firstName),
        chunksFound: chunks.length,
        noMatch: true,
        ...usage,
      });
    }

    return jsonResponse({
      answer: firstTurnAnswer(reply.text, historyForLlm, firstName),
      chunksFound: chunks.length,
      ...usage,
    });
  } catch (err) {
    // Do NOT log request body — only the error message reaches console.
    console.error('search:', err instanceof Error ? err.message : String(err));
    return jsonResponse({ error: ERROR_GENERIC }, 500);
  }
});
