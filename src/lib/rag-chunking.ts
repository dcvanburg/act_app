/**
 * Pure chunking logic for RAG ingest (scripts/ingest-rag-content.ts).
 * Splits Dutch program content into searchable segments.
 */

import type { ContentSection, ModuleContent } from '@/types/content';

export type RagChunkInput = {
  content: string;
  metadata: Record<string, string | number>;
};

export type RagDocumentInput = {
  sourcePath: string;
  title: string;
  category: 'module' | 'daily-practice' | 'intake' | 'exercise' | 'overview';
  phase?: string;
  moduleNumber?: number;
  chunks: RagChunkInput[];
};

function hasPlaceholder(text: string): boolean {
  return text.includes('[PLACEHOLDER');
}

function sectionText(section: ContentSection): string {
  let text = section.title;
  if (section.body) {
    text += `\n\n${section.body}`;
  }
  if (section.points) {
    text += `\n\n${section.points.map((p) => `• ${p}`).join('\n')}`;
  }
  if (section.examples) {
    for (const [key, value] of Object.entries(section.examples)) {
      if (value) text += `\n\nVoorbeeld (${key}): ${value}`;
    }
  }
  return text.trim();
}

export function chunkModule(module: ModuleContent, sourcePath: string): RagDocumentInput {
  const chunks: RagChunkInput[] = [];

  const overview = [
    `Module ${module.moduleNumber}: ${module.title}`,
    `Fase: ${module.phase}`,
    `Doel: ${module.goal}`,
    module.actProcess,
    module.bodyWork,
  ].join('\n');

  if (!hasPlaceholder(overview)) {
    chunks.push({
      content: overview,
      metadata: {
        type: 'overview',
        moduleId: module.id,
        sectionTitle: module.title,
        moduleNumber: module.moduleNumber,
      },
    });
  }

  for (const section of module.sections) {
    const text = sectionText(section);
    if (!text || hasPlaceholder(text)) continue;
    chunks.push({
      content: text,
      metadata: {
        type: 'section',
        moduleId: module.id,
        sectionId: section.id,
        sectionTitle: section.title,
        moduleNumber: module.moduleNumber,
      },
    });
  }

  const exercise = module.bodyExercise;
  const exerciseText = [
    `Lichaamsoefening: ${exercise.title}`,
    exercise.description,
    exercise.transcript.replace(/\[pauze \d+ sec\]/gi, '').trim(),
  ]
    .filter(Boolean)
    .join('\n\n');

  if (!hasPlaceholder(exerciseText)) {
    chunks.push({
      content: exerciseText,
      metadata: {
        type: 'body-exercise',
        moduleId: module.id,
        sectionTitle: exercise.title,
        moduleNumber: module.moduleNumber,
      },
    });
  }

  const task = module.practicalTask;
  const taskText = `${task.title}\n\n${task.body}`;
  if (!hasPlaceholder(taskText)) {
    chunks.push({
      content: taskText,
      metadata: {
        type: 'practical-task',
        moduleId: module.id,
        sectionTitle: task.title,
        moduleNumber: module.moduleNumber,
      },
    });
  }

  return {
    sourcePath,
    title: module.title,
    category: 'module',
    phase: module.phase,
    moduleNumber: module.moduleNumber,
    chunks,
  };
}

export function chunkPlainDocument(args: {
  sourcePath: string;
  title: string;
  category: RagDocumentInput['category'];
  sections: Array<{ title: string; body: string; metadata?: Record<string, string | number> }>;
  phase?: string;
  moduleNumber?: number;
}): RagDocumentInput {
  const chunks: RagChunkInput[] = [];

  for (const section of args.sections) {
    const text = `${section.title}\n\n${section.body}`.trim();
    if (!text || hasPlaceholder(text)) continue;
    chunks.push({
      content: text,
      metadata: {
        type: 'section',
        sectionTitle: section.title,
        ...(section.metadata ?? {}),
      },
    });
  }

  return {
    sourcePath: args.sourcePath,
    title: args.title,
    category: args.category,
    phase: args.phase,
    moduleNumber: args.moduleNumber,
    chunks,
  };
}
