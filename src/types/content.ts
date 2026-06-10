/**
 * Type definitions for Dutch content JSON files.
 * Code in English; displayed values in Dutch.
 *
 * Runtime validation (Zod schemas) should be added alongside these types once
 * package.json / deps are bootstrapped — see docs/OPEN_QUESTIONS.md.
 */

export type ComplaintType = 'pain' | 'mental' | 'alcohol' | 'combination';

export type ModuleId =
  | 'onboarding'
  | 'recognition'
  | 'acceptance'
  | 'defusion'
  | 'presence'
  | 'self-as-context'
  | 'values'
  | 'committed-action';

export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';

// Complaint-specific example text shown below a section's main body.
// Only the key matching the user's complaintType is rendered — never replaces body text.
export type ConditionalExamples = Partial<Record<ComplaintType, string>>;

// A section has either body text OR a bullet-point list — never both, never neither.
// `examples` is optional on both variants; most sections will omit it.
export type ContentSection =
  | { id: string; title: string; body: string; points?: never; examples?: ConditionalExamples }
  | { id: string; title: string; body?: never; points: string[]; examples?: ConditionalExamples };

export type BodyExercise = {
  title: string;
  description: string;
  audioUrl: string | null;
  transcript: string;
};

// Emergency grounding exercise — different shape from BodyExercise (has steps + crisisLink).
export type GroundingStep = {
  id: string;
  instruction: string;
};

export type GroundingExercise = {
  id: 'emergency-grounding';
  title: string;
  description: string;
  steps: GroundingStep[];
  audioUrl: string | null;
  transcript: string;
  crisisLink: {
    label: string;
    path: string;
  };
};

export type BackReference = {
  moduleId: ModuleId;
  label: string;
};

export type ModuleContent = {
  id: ModuleId;
  moduleNumber: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  phase: string;
  actProcess: string;
  bodyWork: string;
  goal: string;
  sections: ContentSection[];
  bodyExercise: BodyExercise;
  practicalTask: {
    title: string;
    body: string;
  };
  backReferences: BackReference[];
};

export type DailyPracticeContent = {
  title: string;
  description: string;
  features: {
    exercises: { title: string; description: string; placeholder: string };
    journal: { title: string; description: string; promptPlaceholder: string };
    checkIn: { title: string; description: string; questionsPlaceholder: string };
  };
};

export type SubscriptionTier = 'free' | 'paid';

// Account-level profile — separate from therapeutic progress.
// subscriptionTier is always 'free' in v1; placeholder for future paywall.
export type UserProfile = {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
};

export type ModuleProgress = {
  moduleId: ModuleId;
  status: ModuleStatus;
  startedAt?: string;
  completedAt?: string;
  lastStepId?: string;
  notes?: string;
};

export type SafetyOutcome = 'pass' | 'flag' | 'block-strong' | 'block-medical';

export type SafetyAnswerOption = {
  value: string;
  label: string;
  blocking: SafetyOutcome;
};

export type SafetyQuestion = {
  id: string;
  title: string;
  type: 'single-choice';
  options: SafetyAnswerOption[];
  helpText?: string;
};

export type UserProgress = {
  intake: {
    complaintTypes: ComplaintType[];
    safetyOutcome?: SafetyOutcome;
    completedAt?: string;
  };
  safetyCheckPassed: boolean;
  modules: ModuleProgress[];
  dailyPracticeUnlocked: boolean;
};

// ── γ-1 mood tracker ─────────────────────────────────────────────────────────

export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type EmotionTag =
  | 'angst'
  | 'verdriet'
  | 'boos'
  | 'stress'
  | 'pijn'
  | 'vermoeid'
  | 'rustig'
  | 'ontspannen'
  | 'hoopvol'
  | 'blij'
  | 'dankbaar'
  | 'tevreden'
  | 'energiek'
  | 'trots'
  | 'verbonden';

/** Stored row from the `mood_logs` table. */
export interface MoodLog {
  id: string;
  user_id: string;
  date: string; // ISO date YYYY-MM-DD
  mood_score: MoodScore;
  emotion_tags: EmotionTag[];
  note: string | null;
  created_at: string;
}
