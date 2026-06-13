import { describe, expect, it } from 'vitest';

import acceptance from '@/content/nl/modules/2-acceptance.json';
import { chunkModule } from '@/lib/rag-chunking';
import type { ModuleContent } from '@/types/content';

describe('chunkModule', () => {
  it('produces chunks for acceptance module without placeholders', () => {
    const doc = chunkModule(
      acceptance as ModuleContent,
      'src/content/nl/modules/2-acceptance.json',
    );
    expect(doc.chunks.length).toBeGreaterThan(3);
    expect(doc.title).toBe('Acceptatie');
    expect(doc.category).toBe('module');
  });

  it('includes section about acceptatie vs opgeven', () => {
    const doc = chunkModule(
      acceptance as ModuleContent,
      'src/content/nl/modules/2-acceptance.json',
    );
    const section = doc.chunks.find((c) => c.metadata.sectionId === 'not-giving-up');
    expect(section?.content).toContain('Acceptatie is niet opgeven');
  });

  it('skips sections that still contain placeholders', () => {
    const doc = chunkModule(
      {
        ...(acceptance as ModuleContent),
        sections: [
          {
            id: 'placeholder-section',
            title: 'Tijdelijk',
            body: '[PLACEHOLDER] nog niet geschreven',
          },
        ],
      },
      'test.json',
    );
    expect(doc.chunks.some((c) => c.metadata.sectionId === 'placeholder-section')).toBe(false);
  });
});
