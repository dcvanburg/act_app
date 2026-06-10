import type { SafetyAnswerOption, SafetyOutcome, SafetyQuestion } from '@/types/content';

/**
 * Resolve a single safety question's answer to its outcome.
 *
 * Returns `null` if the value isn't one of the question's options (caller has
 * a bug or content drift; treat as no answer rather than passing silently).
 */
export function outcomeForAnswer(
  question: SafetyQuestion,
  value: string | null,
): SafetyOutcome | null {
  if (value === null) return null;
  const option = question.options.find((o: SafetyAnswerOption) => o.value === value);
  return option ? option.blocking : null;
}

/**
 * Worst (most restrictive) outcome across all answered questions.
 *
 * Priority — most restrictive wins:
 *   block-strong  > block-medical > flag > pass
 *
 * Unanswered questions are skipped. If NO question has been answered yet the
 * function returns `null` so the caller can distinguish "in progress" from
 * "everyone said pass".
 */
const PRIORITY: SafetyOutcome[] = ['block-strong', 'block-medical', 'flag', 'pass'];

export function worstOutcome(
  questions: SafetyQuestion[],
  answers: Record<string, string>,
): SafetyOutcome | null {
  let worst: SafetyOutcome | null = null;
  for (const q of questions) {
    const o = outcomeForAnswer(q, answers[q.id] ?? null);
    if (o === null) continue;
    if (worst === null || PRIORITY.indexOf(o) < PRIORITY.indexOf(worst)) {
      worst = o;
    }
  }
  return worst;
}

/** Whether the user is allowed to enter the program based on the safety outcome. */
export function isProgramAllowed(outcome: SafetyOutcome | null): boolean {
  return outcome === 'pass' || outcome === 'flag';
}

/** True when every question has been answered. */
export function isComplete(questions: SafetyQuestion[], answers: Record<string, string>): boolean {
  return questions.every((q) => Boolean(answers[q.id]));
}
