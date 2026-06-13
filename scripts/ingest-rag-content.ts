/**
 * Ingest Dutch program content into the RAG chunks table.
 *
 * Requires in .env.local:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VOYAGE_API_KEY
 *
 * Run: npm run ingest:rag
 * Dry run (no API/DB writes): npm run ingest:rag -- --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
// `ws` ships no types; we only need it as the realtime transport so
// supabase-js's realtime client can construct on Node 20. Cast at use.
// @ts-expect-error untyped CJS module
import WS from 'ws';

import dailyPractice from '../src/content/nl/daily-practice.json';
import intake from '../src/content/nl/intake.json';
import programOverview from '../src/content/nl/program-overview.json';
import onboarding from '../src/content/nl/modules/0-onboarding.json';
import recognition from '../src/content/nl/modules/1-recognition.json';
import acceptance from '../src/content/nl/modules/2-acceptance.json';
import defusion from '../src/content/nl/modules/3-defusion.json';
import presence from '../src/content/nl/modules/4-presence.json';
import selfAsContext from '../src/content/nl/modules/5-self-as-context.json';
import values from '../src/content/nl/modules/6-values.json';
import committedAction from '../src/content/nl/modules/7-committed-action.json';
import {
  chunkModule,
  chunkPlainDocument,
  type RagDocumentInput,
} from '../src/lib/rag-chunking';
import type { ModuleContent } from '../src/types/content';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const VOYAGE_MODEL = 'voyage-3';
const EMBED_BATCH_SIZE = 4;
/** Voyage free tier without billing: 3 RPM — stay under with ~21s between calls. */
const MIN_REQUEST_INTERVAL_MS = 21_000;
const MAX_EMBED_RETRIES = 6;

const MODULE_SOURCES: Array<{ path: string; module: ModuleContent }> = [
  { path: 'src/content/nl/modules/0-onboarding.json', module: onboarding as ModuleContent },
  { path: 'src/content/nl/modules/1-recognition.json', module: recognition as ModuleContent },
  { path: 'src/content/nl/modules/2-acceptance.json', module: acceptance as ModuleContent },
  { path: 'src/content/nl/modules/3-defusion.json', module: defusion as ModuleContent },
  { path: 'src/content/nl/modules/4-presence.json', module: presence as ModuleContent },
  {
    path: 'src/content/nl/modules/5-self-as-context.json',
    module: selfAsContext as ModuleContent,
  },
  { path: 'src/content/nl/modules/6-values.json', module: values as ModuleContent },
  {
    path: 'src/content/nl/modules/7-committed-action.json',
    module: committedAction as ModuleContent,
  },
];

function loadEnvFile(): void {
  const envPath = resolve(ROOT, '.env.local');
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local is optional if vars are already exported
  }
}

function collectDocuments(): RagDocumentInput[] {
  const docs = MODULE_SOURCES.map(({ path, module }) => chunkModule(module, path));

  // Program overview (what Van Overleven naar Leven is, ACT in plain Dutch,
  // who the chatbot is). Pending therapist sign-off — see chatbot-drafts.md.
  docs.push(
    chunkPlainDocument({
      sourcePath: 'src/content/nl/program-overview.json',
      title: programOverview.title,
      category: 'overview',
      sections: programOverview.sections.map((s) => ({
        title: s.title,
        body: s.body,
        metadata: { sectionId: s.id },
      })),
    }),
  );

  docs.push(
    chunkPlainDocument({
      sourcePath: 'src/content/nl/daily-practice.json',
      title: dailyPractice.title,
      category: 'daily-practice',
      sections: [
        { title: dailyPractice.title, body: dailyPractice.description },
        {
          title: dailyPractice.features.exercises.title,
          body: `${dailyPractice.features.exercises.description}\n\n${dailyPractice.features.exercises.placeholder}`,
        },
        {
          title: dailyPractice.features.journal.title,
          body: `${dailyPractice.features.journal.description}\n\n${dailyPractice.features.journal.promptPlaceholder}`,
        },
        {
          title: dailyPractice.features.checkIn.title,
          body: `${dailyPractice.features.checkIn.description}\n\n${dailyPractice.features.checkIn.questionsPlaceholder}`,
        },
      ],
    }),
  );

  docs.push(
    chunkPlainDocument({
      sourcePath: 'src/content/nl/intake.json',
      title: intake.title,
      category: 'intake',
      sections: [
        { title: intake.welcome.title, body: intake.welcome.body },
        {
          title: intake.complaintTypes.title,
          body: [
            intake.complaintTypes.subtitle,
            ...Object.values(intake.complaintTypes.options).map(
              (o) => `${o.label}: ${o.description}`,
            ),
          ].join('\n'),
        },
      ],
    }),
  );

  const exerciseDir = resolve(ROOT, 'src/content/nl/exercises');
  for (const file of readdirSync(exerciseDir).filter((f) => f.endsWith('.json'))) {
    const sourcePath = `src/content/nl/exercises/${file}`;
    const exercise = JSON.parse(readFileSync(resolve(exerciseDir, file), 'utf8')) as {
      title: string;
      description: string;
      transcript?: string;
      steps?: Array<{ instruction: string }>;
    };
    const body = [
      exercise.description,
      exercise.transcript,
      exercise.steps?.map((s) => s.instruction).join('\n'),
    ]
      .filter(Boolean)
      .join('\n\n');
    const doc = chunkPlainDocument({
      sourcePath,
      title: exercise.title,
      category: 'exercise',
      sections: [{ title: exercise.title, body }],
    });
    if (doc.chunks.length > 0) docs.push(doc);
  }

  return docs.filter((d) => d.chunks.length > 0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastEmbedRequestAt = 0;

async function embedBatch(apiKey: string, texts: string[]): Promise<number[][]> {
  for (let attempt = 0; attempt <= MAX_EMBED_RETRIES; attempt++) {
    const sinceLast = Date.now() - lastEmbedRequestAt;
    if (sinceLast < MIN_REQUEST_INTERVAL_MS) {
      await sleep(MIN_REQUEST_INTERVAL_MS - sinceLast);
    }

    lastEmbedRequestAt = Date.now();
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
        model: VOYAGE_MODEL,
        input_type: 'document',
      }),
    });

    if (res.status === 429 && attempt < MAX_EMBED_RETRIES) {
      const retryAfter = Number(res.headers.get('retry-after') ?? 0);
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : MIN_REQUEST_INTERVAL_MS * (attempt + 2);
      console.warn(`  Voyage rate limit — waiting ${Math.round(waitMs / 1000)}s…`);
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Voyage API ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((row) => row.embedding);
  }

  throw new Error('Voyage API: max retries exceeded');
}

async function main(): Promise<void> {
  loadEnvFile();
  const dryRun = process.argv.includes('--dry-run');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const voyageKey = process.env.VOYAGE_API_KEY;

  const documents = collectDocuments();
  const totalChunks = documents.reduce((n, d) => n + d.chunks.length, 0);

  console.log(`Documents: ${documents.length}, chunks: ${totalChunks}`);

  if (dryRun) {
    for (const doc of documents) {
      console.log(`  ${doc.sourcePath} → ${doc.chunks.length} chunks`);
    }
    return;
  }

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!voyageKey) {
    throw new Error('Missing VOYAGE_API_KEY');
  }

  // Node 20 has no native WebSocket; supabase-js's realtime client throws
  // on construction unless we hand it `ws`. The ingest script does not use
  // realtime, but the constructor still wires it up.
  const supabase = createClient(supabaseUrl, serviceKey, {
    realtime: { transport: WS as unknown as typeof WebSocket },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: deleteChunksError } = await supabase.from('chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteChunksError) {
    throw new Error(`Failed to clear chunks: ${deleteChunksError.message}`);
  }

  const { error: deleteDocsError } = await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteDocsError) {
    throw new Error(`Failed to clear documents: ${deleteDocsError.message}`);
  }

  let insertedChunks = 0;

  for (const doc of documents) {
    const { data: insertedDoc, error: docError } = await supabase
      .from('documents')
      .insert({
        source_path: doc.sourcePath,
        title: doc.title,
        category: doc.category,
        phase: doc.phase ?? null,
        module_number: doc.moduleNumber ?? null,
      })
      .select('id')
      .single();

    if (docError || !insertedDoc) {
      throw new Error(`Document insert failed (${doc.sourcePath}): ${docError?.message}`);
    }

    for (let i = 0; i < doc.chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = doc.chunks.slice(i, i + EMBED_BATCH_SIZE);
      const embeddings = await embedBatch(
        voyageKey,
        batch.map((c) => c.content),
      );

      const rows = batch.map((chunk, idx) => ({
        document_id: insertedDoc.id,
        content: chunk.content,
        embedding: embeddings[idx],
        metadata: chunk.metadata,
      }));

      const { error: chunkError } = await supabase.from('chunks').insert(rows);
      if (chunkError) {
        throw new Error(`Chunk insert failed (${doc.sourcePath}): ${chunkError.message}`);
      }
      insertedChunks += rows.length;
      process.stdout.write(`  ${doc.sourcePath}: ${insertedChunks}/${totalChunks}\r`);
    }
    console.log(`  ✓ ${doc.sourcePath} (${doc.chunks.length} chunks)`);
  }

  console.log(`Done. Ingested ${insertedChunks} chunks across ${documents.length} documents.`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
