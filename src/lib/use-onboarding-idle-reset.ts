import { useEffect } from 'react';

/** Re-run local onboarding step state when SessionPolicyProvider adds `reset`. */
export function useOnboardingIdleReset(
  reset: string | string[] | undefined,
  resetState: () => void,
): void {
  useEffect(() => {
    if (!reset) return;
    resetState();
  }, [reset, resetState]);
}
