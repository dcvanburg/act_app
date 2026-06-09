import { describe, it, expect } from 'vitest';
import {
  getModuleStatus,
  isAccessible,
  getResumeScreenId,
  withModuleUpdate,
  getDefaultProgress,
  MODULE_ORDER,
} from '../progress';
import type { UserProgress } from '@/types/content';

const base = getDefaultProgress();

describe('getModuleStatus', () => {
  it('onboarding is always available with no progress', () => {
    expect(getModuleStatus('onboarding', base)).toBe('available');
  });

  it('module 1 is locked when onboarding is not completed', () => {
    expect(getModuleStatus('recognition', base)).toBe('locked');
  });

  it('module 1 unlocks after onboarding is completed', () => {
    const progress: UserProgress = {
      ...base,
      modules: [{ moduleId: 'onboarding', status: 'completed', startedAt: '', completedAt: '' }],
    };
    expect(getModuleStatus('recognition', progress)).toBe('available');
  });

  it('module 2 stays locked when only module 0 is done', () => {
    const progress: UserProgress = {
      ...base,
      modules: [{ moduleId: 'onboarding', status: 'completed', startedAt: '', completedAt: '' }],
    };
    expect(getModuleStatus('acceptance', progress)).toBe('locked');
  });

  it('returns stored status if present', () => {
    const progress: UserProgress = {
      ...base,
      modules: [{ moduleId: 'onboarding', status: 'in_progress', startedAt: '' }],
    };
    expect(getModuleStatus('onboarding', progress)).toBe('in_progress');
  });
});

describe('isAccessible', () => {
  it('available module is accessible', () => {
    expect(isAccessible('onboarding', base)).toBe(true);
  });

  it('locked module is not accessible', () => {
    expect(isAccessible('recognition', base)).toBe(false);
  });
});

describe('withModuleUpdate', () => {
  it('creates a new module entry on first visit', () => {
    const updated = withModuleUpdate(base, 'onboarding', 'intro', false);
    const mod = updated.modules.find((m) => m.moduleId === 'onboarding');
    expect(mod?.status).toBe('in_progress');
    expect(mod?.lastStepId).toBe('intro');
  });

  it('marks module completed on final screen', () => {
    const updated = withModuleUpdate(base, 'onboarding', 'practical-task', true);
    const mod = updated.modules.find((m) => m.moduleId === 'onboarding');
    expect(mod?.status).toBe('completed');
    expect(mod?.completedAt).toBeDefined();
  });

  it('does not downgrade a completed module', () => {
    const withCompleted = withModuleUpdate(base, 'onboarding', 'practical-task', true);
    const updated = withModuleUpdate(withCompleted, 'onboarding', 'intro', false);
    expect(updated.modules.find((m) => m.moduleId === 'onboarding')?.status).toBe('completed');
  });

  it('unlocks dailyPractice when all modules completed', () => {
    let progress = base;
    for (const id of MODULE_ORDER) {
      progress = withModuleUpdate(progress, id, 'practical-task', true);
    }
    expect(progress.dailyPracticeUnlocked).toBe(true);
  });
});

describe('getResumeScreenId', () => {
  it('returns null with no progress', () => {
    expect(getResumeScreenId('onboarding', base)).toBeNull();
  });

  it('returns the stored lastStepId', () => {
    const progress = withModuleUpdate(base, 'onboarding', 'avoidance-cycle', false);
    expect(getResumeScreenId('onboarding', progress)).toBe('avoidance-cycle');
  });
});
