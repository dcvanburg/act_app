import { describe, expect, it } from 'vitest';

import { isComplete, isProgramAllowed, outcomeForAnswer, worstOutcome } from '../safety';
import type { SafetyQuestion } from '@/types/content';

const q1: SafetyQuestion = {
  id: 'q1',
  title: 'Q1',
  type: 'single-choice',
  options: [
    { value: 'never', label: 'Nee', blocking: 'pass' },
    { value: 'sometimes', label: 'Soms', blocking: 'flag' },
    { value: 'often', label: 'Vaak', blocking: 'block-strong' },
  ],
};

const q2: SafetyQuestion = {
  id: 'q2',
  title: 'Q2',
  type: 'single-choice',
  options: [
    { value: 'no', label: 'Nee', blocking: 'pass' },
    { value: 'yes', label: 'Ja', blocking: 'block-medical' },
  ],
};

describe('outcomeForAnswer', () => {
  it('resolves a known value to its blocking outcome', () => {
    expect(outcomeForAnswer(q1, 'never')).toBe('pass');
    expect(outcomeForAnswer(q1, 'often')).toBe('block-strong');
  });

  it('returns null for unanswered or unknown values', () => {
    expect(outcomeForAnswer(q1, null)).toBeNull();
    expect(outcomeForAnswer(q1, 'nope')).toBeNull();
  });
});

describe('worstOutcome', () => {
  it('returns null when nothing is answered yet', () => {
    expect(worstOutcome([q1, q2], {})).toBeNull();
  });

  it('returns pass when every answer is pass', () => {
    expect(worstOutcome([q1, q2], { q1: 'never', q2: 'no' })).toBe('pass');
  });

  it('returns block-strong when any answer is block-strong', () => {
    expect(worstOutcome([q1, q2], { q1: 'often', q2: 'no' })).toBe('block-strong');
  });

  it('prioritises block-strong over block-medical', () => {
    expect(worstOutcome([q1, q2], { q1: 'often', q2: 'yes' })).toBe('block-strong');
  });

  it('flag beats pass', () => {
    expect(worstOutcome([q1, q2], { q1: 'sometimes', q2: 'no' })).toBe('flag');
  });

  it('skips unanswered questions', () => {
    expect(worstOutcome([q1, q2], { q1: 'sometimes' })).toBe('flag');
  });
});

describe('isProgramAllowed', () => {
  it('allows pass and flag', () => {
    expect(isProgramAllowed('pass')).toBe(true);
    expect(isProgramAllowed('flag')).toBe(true);
  });
  it('blocks block-strong and block-medical', () => {
    expect(isProgramAllowed('block-strong')).toBe(false);
    expect(isProgramAllowed('block-medical')).toBe(false);
  });
  it('treats null (no answers yet) as not allowed', () => {
    expect(isProgramAllowed(null)).toBe(false);
  });
});

describe('isComplete', () => {
  it('false when any question is unanswered', () => {
    expect(isComplete([q1, q2], { q1: 'never' })).toBe(false);
  });
  it('true when every question has an answer', () => {
    expect(isComplete([q1, q2], { q1: 'never', q2: 'no' })).toBe(true);
  });
});
