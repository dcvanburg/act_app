import { type Href, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { getModuleStatus } from '@/lib/progress';
import { useProfile } from '@/lib/profile-queries';
import { useUserProgress } from '@/lib/progress-queries';
import {
  isIdleExceeded,
  isOnOnboardingRoute,
  isSessionExpired,
  resolveIdleNavigation,
  resolveOnboardingStartRoute,
} from '@/lib/session-policy';
import {
  clearSessionPolicyStorage,
  ensureSessionAnchor,
  getLastActiveAt,
  getSessionAnchor,
  setLastActiveAt,
} from '@/lib/session-storage';
import { useAuth } from '@/providers/AuthProvider';

function withResetParam(route: string, reset: number): string {
  return route.includes('?') ? `${route}&reset=${reset}` : `${route}?reset=${reset}`;
}

/**
 * Enforces session expiry (30 days at 03:00 Europe/Amsterdam) and idle
 * navigation (30 minutes inactive → home, or onboarding restart).
 */
export function SessionPolicyProvider({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { from } = useGlobalSearchParams<{ from?: string }>();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const handlingRef = useRef(false);

  const handleForeground = useCallback(async () => {
    if (!session || handlingRef.current) return;

    handlingRef.current = true;
    try {
      await ensureSessionAnchor();

      const anchor = await getSessionAnchor();
      if (anchor && isSessionExpired(anchor)) {
        await clearSessionPolicyStorage();
        await signOut();
        router.replace('/login?reason=session_expired');
        return;
      }

      const lastActive = await getLastActiveAt();
      const now = new Date();

      if (!isIdleExceeded(lastActive, now)) {
        await setLastActiveAt(now.toISOString());
        return;
      }

      if (profileLoading || progressLoading) {
        await setLastActiveAt(now.toISOString());
        return;
      }

      const onboardingModuleCompleted =
        progress !== undefined && getModuleStatus('onboarding', progress) === 'completed';

      const action = resolveIdleNavigation({
        isOnOnboarding: isOnOnboardingRoute(pathname, from),
        onboardingModuleCompleted,
        pathname,
      });

      if (action === 'onboarding_start') {
        const target = withResetParam(resolveOnboardingStartRoute(profile?.first_name), now.getTime());
        router.replace(target as Href);
      } else if (action === 'home') {
        router.replace('/home');
      }

      await setLastActiveAt(now.toISOString());
    } finally {
      handlingRef.current = false;
    }
  }, [
    session,
    signOut,
    router,
    pathname,
    from,
    profile?.first_name,
    profileLoading,
    progress,
    progressLoading,
  ]);

  useEffect(() => {
    if (loading || !session) return;
    void handleForeground();
  }, [loading, session, handleForeground]);

  useEffect(() => {
    async function onAppStateChange(next: AppStateStatus) {
      if (next === 'background' || next === 'inactive') {
        await setLastActiveAt(new Date().toISOString());
        return;
      }

      if (next === 'active') {
        await handleForeground();
      }
    }

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [handleForeground]);

  return children;
}
