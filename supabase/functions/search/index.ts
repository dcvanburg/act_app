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
 *     (v1.1-DRAFT — awaiting therapist re-approval; v1.0 stays the
 *     fallback if the warmer tone is rejected). When the drafts revise,
 *     mirror here.
 *
 * Deploy: scripts/deploy-rag-functions.sh
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

import {
  assessClarifyNeed,
  buildClarifyOptions,
  buildTopRetrievalOptions,
  CLARIFY_PROMPTS,
  type StructuredReply,
} from './ambiguity.ts';
import {
  formatGreetingOnlyReply,
  isGreetingOnly,
  prependFirstTurnGreeting,
  stripClarifyBulletOptions,
  stripGreetingPrefix,
} from './greeting.ts';
import {
  fetchChatUserContext,
  fetchFirstName,
  formatChatUserContext,
  isUserContextEmpty,
} from './user-context.ts';
import {
  fetchStoredChatMessages,
  formatConversationMemory,
  recentTurnMessages,
} from './conversation-context.ts';

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

// ── Dutch copy (mirror of docs/THERAPEUT_KB/chatbot-drafts.md v1.1-DRAFT) ───
//
// v1.1 shifts the persona from "information gateway" to a warmer ACT-grounded
// begeleider while keeping the original v1.0 guardrails intact:
//   - scope stays bound to "INFORMATIE UIT HET PROGRAMMA" + user profile,
//   - structured tool output stays (answer / clarify / out_of_scope),
//   - crisis deflection wording and 0800-0113 stay verbatim,
//   - no medical advice, no invented exercises, no medication talk.
//
// This block is sent through Anthropic prompt caching (ephemeral) so the
// stable persona + instructions are billed at the cache-read rate after the
// first request. The dynamic chunks + user profile are appended as a second,
// uncached system block in askClaude().

const SYSTEM_PROMPT_INSTRUCTIONS = `Je bent een rustige, warme begeleider in de app Van Overleven naar Leven. De app is een zelfstandig therapeutisch programma op basis van Acceptance and Commitment Therapy (ACT) en lichaamsgerichte psychosomatische therapie. Je bent geen therapeut, je bent een gids in het programma.

Hoe je klinkt:
• Rustig, warm, in jij-vorm. Je oordeelt niet en je haast niet.
• Je luistert reflectief: vat eerst kort samen wat je leest voor je iets toevoegt.
• Eén open vraag per beurt, niet meer. Liever doorvragen dan gokken.
• Korte zinnen, ruim wit. Maximaal drie alinea's per antwoord. Geen vakjargon, of leg het meteen uit.
• Geen uitroeptekens. Gebruik een punt, komma of dubbele punt als zinsbreuk, geen streepjes.
• Opsommingen met • en maximaal vijf punten.

ACT-principes die je toepast wanneer de bronnen dat ondersteunen:
• Acceptatie: ruimte maken voor wat er is, niet vechten tegen klachten.
• Defusie: gedachten zien als gedachten, niet als feiten.
• Aanwezig zijn: terug naar het hier en nu.
• Waarden: verbinding met wat echt belangrijk is.
• Toegewijd handelen: kleine, concrete stappen.
• Zelf als context: jezelf zien als groter dan je gedachten en gevoelens.

Je gebruikt deze taal alleen als de "INFORMATIE UIT HET PROGRAMMA" het ondersteunt. Je verzint geen oefeningen of metaforen die er niet staan.

Wat je doet:
• Je beantwoordt vragen op basis van "INFORMATIE UIT HET PROGRAMMA" en, als de vraag daarover gaat, "INFORMATIE UIT JE PROFIEL IN DE APP" (stemming, waarden, check-ins, acties, barrières) en "Eerdere gesprekken met de gids" wanneer die aanwezig zijn.
• Bij vragen over het verloop van stemming of waarden: beschrijf alleen wat in het profiel staat. Geen interpretatie, geen diagnose, geen advies om iets te veranderen.
• Koppel profielinformatie waar nuttig aan programmainformatie, maar blijf binnen wat er staat.
• Als persoonlijke gegevens ontbreken, zeg dat eerlijk en verwijs naar het betreffende scherm in de app (stemming, waarden).
• Je benadrukt dat klachten geen vijand zijn en dat terugval informatie is, geen mislukking.

Bij twijfel over de bedoeling van de vraag:
• Gebruik type "clarify": stel één korte verduidelijkingsvraag in text. Zet de keuzemogelijkheden uitsluitend in options, niet als opsomming in text.
• Geef geen antwoord als je niet zeker bent.

Antwoordformaat (verplicht via tool chat_reply):
• type "answer": je bent zeker; antwoord staat in de bronnen of het profiel.
• type "clarify": bedoeling onduidelijk; geen inhoudelijk antwoord, alleen doorvraag + options.
• type "out_of_scope": buiten programma en profiel; verwijs naar huisarts en 0800-0113.

Wat je nooit doet:
• Je geeft nooit medisch advies, geen diagnose, geen behandelplan.
• Je verzint nooit oefeningen, technieken of citaten die niet in de informatie staan. Als iets er niet staat, zeg je dat eerlijk.
• Je doet geen uitspraken over medicatie, dosering of het stoppen daarmee.
• Je doet geen beloften over herstel.
• Je stelt geen meerdere vragen tegelijk.
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

const CHAT_REPLY_TOOL = {
  name: 'chat_reply',
  description:
    'Structured Dutch reply. Use clarify when intent is unclear. Never invent content not in context.',
  input_schema: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['answer', 'clarify', 'out_of_scope'] },
      text: { type: 'string', description: 'Dutch message to the user' },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'Required for clarify: 2-3 short Dutch options',
      },
    },
    required: ['type', 'text'],
  },
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
    (input.type === 'answer' || input.type === 'clarify' || input.type === 'out_of_scope') &&
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

function resolveClarifyOptions(
  reply: StructuredReply,
  question: string,
  chunks: Chunk[],
  userContextData: Awaited<ReturnType<typeof fetchChatUserContext>>,
): string[] {
  const fromLlm = (reply.options ?? []).map((o) => o.trim()).filter(Boolean).slice(0, 3);
  if (fromLlm.length >= 2) return fromLlm;
  if (chunks.length > 0) return buildTopRetrievalOptions(chunks);
  if (fromLlm.length > 0) return fromLlm;
  return buildClarifyOptions(question, chunks, userContextData);
}

function firstTurnAnswer(
  answer: string,
  history: ChatMessage[],
  firstName: string | null,
): string {
  if (history.length > 0) return answer;
  return prependFirstTurnGreeting(answer, firstName);
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

    const firstName = await fetchFirstName(supabase, user.id);
    const storedMessages = await fetchStoredChatMessages(supabase, user.id);
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

    const userContextData = await fetchChatUserContext(supabase, user.id);
    const userContextText = formatChatUserContext(userContextData);

    const embedding = await getEmbedding(searchQuestion);
    const chunks = await hybridSearch(
      supabase,
      searchQuestion,
      embedding,
      filterCategory,
      filterPhase,
    );

    if (chunks.length === 0 && isUserContextEmpty(userContextData)) {
      return jsonResponse({
        answer: firstTurnAnswer(OUT_OF_SCOPE_RESPONSE, historyForLlm, firstName),
        chunksFound: 0,
        noMatch: true,
      });
    }

    const preClarify = assessClarifyNeed(searchQuestion, chunks, userContextData, historyForLlm);
    if (preClarify) {
      return jsonResponse({
        answer: firstTurnAnswer(stripClarifyBulletOptions(CLARIFY_PROMPTS[preClarify.reason]), historyForLlm, firstName),
        chunksFound: chunks.length,
        clarify: true,
        clarifyOptions: preClarify.options,
      });
    }

    const { reply, inputTokens, cacheReadInputTokens, cacheCreationInputTokens } =
      await askClaude(searchQuestion, chunks, historyForLlm, userContextText, conversationMemory);

    const usage = {
      inputTokens,
      cacheReadInputTokens,
      cacheCreationInputTokens,
    };

    if (reply.type === 'clarify') {
      const options = resolveClarifyOptions(reply, searchQuestion, chunks, userContextData);
      return jsonResponse({
        answer: firstTurnAnswer(stripClarifyBulletOptions(reply.text), historyForLlm, firstName),
        chunksFound: chunks.length,
        clarify: true,
        clarifyOptions: options,
        ...usage,
      });
    }

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
