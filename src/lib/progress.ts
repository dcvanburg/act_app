import type { ModuleId, ModuleStatus, UserProgress } from '@/types/content';

export const MODULE_ORDER: ModuleId[] = [
  'onboarding',
  'recognition',
  'acceptance',
  'defusion',
  'presence',
  'self-as-context',
  'values',
  'committed-action',
];

export const FINAL_SCREEN_ID = 'practical-task';

export function getModuleStatus(moduleId: ModuleId, progress: UserProgress): ModuleStatus {
  const stored = progress.modules.find(m => m.moduleId === moduleId);
  if (stored) return stored.status;

  const index = MODULE_ORDER.indexOf(moduleId);
  // Module 0 (onboarding) is always available
  if (index === 0) return 'available';

  const prevId = MODULE_ORDER[index - 1];
  if (!prevId) return 'locked';

  const prev = progress.modules.find(m => m.moduleId === prevId);
  return prev?.status === 'completed' ? 'available' : 'locked';
}

export function isAccessible(moduleId: ModuleId, progress: UserProgress): boolean {
  const status = getModuleStatus(moduleId, progress);
  return status !== 'locked';
}

export function getResumeScreenId(moduleId: ModuleId, progress: UserProgress): string | null {
  return progress.modules.find(m => m.moduleId === moduleId)?.lastStepId ?? null;
}

export function getDefaultProgress(): UserProgress {
  return {
    intake: { complaintTypes: [] },
    safetyCheckPassed: false,
    modules: [],
    dailyPracticeUnlocked: false,
  };
}

export function withModuleUpdate(
  progress: UserProgress,
  moduleId: ModuleId,
  lastStepId: string,
  completed: boolean,
): UserProgress {
  const now = new Date().toISOString();
  const existingIndex = progress.modules.findIndex(m => m.moduleId === moduleId);
  const modules = [...progress.modules];

  if (existingIndex >= 0) {
    const existing = modules[existingIndex];
    if (!existing) return progress;
    modules[existingIndex] = {
      ...existing,
      lastStepId,
      status: completed ? 'completed' : existing.status === 'completed' ? 'completed' : 'in_progress',
      ...(completed && existing.status !== 'completed' ? { completedAt: now } : {}),
    };
  } else {
    modules.push({
      moduleId,
      status: completed ? 'completed' : 'in_progress',
      startedAt: now,
      lastStepId,
      ...(completed ? { completedAt: now } : {}),
    });
  }

  const allCompleted = MODULE_ORDER.every(id =>
    modules.find(m => m.moduleId === id)?.status === 'completed',
  );

  return { ...progress, modules, dailyPracticeUnlocked: allCompleted };
}
