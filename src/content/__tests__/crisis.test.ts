import { describe, expect, it } from 'vitest';

import crisis from '@/content/nl/crisis.json';
import groundingRaw from '@/content/nl/exercises/emergency-grounding.json';
import type { GroundingExercise } from '@/types/content';

/**
 * Safety-critical content shape tests.
 *
 * These guard against regressions where someone accidentally removes a field
 * the crisis screen depends on. Content text itself can still be [PLACEHOLDER]
 * (caught by validate-content.ts); these tests check structure only.
 */

const grounding = groundingRaw as GroundingExercise;

describe('crisis.json', () => {
  it('has a non-empty disclaimer', () => {
    expect(crisis.disclaimer.title.length).toBeGreaterThan(0);
    expect(crisis.disclaimer.body.length).toBeGreaterThan(0);
  });

  it('exposes the Dutch crisis line 0800-0113', () => {
    expect(crisis.resources.crisisLine.phone).toBe('0800-0113');
  });

  it('exposes a tel: URI on the crisis line so it can be dialled', () => {
    expect(crisis.resources.crisisLine.phoneUri.startsWith('tel:')).toBe(true);
  });

  it('lists huisarts and GGZ as alternative resources', () => {
    expect(crisis.resources.huisarts.name.length).toBeGreaterThan(0);
    expect(crisis.resources.ggz.name.length).toBeGreaterThan(0);
  });

  it('exposes the 113.nl crisis chat as an alternative to calling', () => {
    expect(crisis.resources.crisisChat.url).toBe('https://113.nl');
    expect(crisis.resources.crisisChat.name.length).toBeGreaterThan(0);
    expect(crisis.resources.crisisChat.description.length).toBeGreaterThan(0);
  });

  it('has a safetyBlock with title and body', () => {
    expect(crisis.safetyBlock.title.length).toBeGreaterThan(0);
    expect(crisis.safetyBlock.body.length).toBeGreaterThan(0);
  });
});

describe('emergency-grounding.json', () => {
  it('has a fixed id so the screen can rely on it', () => {
    expect(grounding.id).toBe('emergency-grounding');
  });

  it('has at least three grounding steps', () => {
    expect(grounding.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('every step has a stable id and an instruction', () => {
    for (const step of grounding.steps) {
      expect(typeof step.id).toBe('string');
      expect(step.id.length).toBeGreaterThan(0);
      expect(typeof step.instruction).toBe('string');
      expect(step.instruction.length).toBeGreaterThan(0);
    }
  });

  it('links to /noodhulp for follow-up support', () => {
    expect(grounding.crisisLink.path).toBe('/noodhulp');
  });
});
