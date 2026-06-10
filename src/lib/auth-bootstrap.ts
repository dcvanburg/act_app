/**
 * Decide which shell to show after auth + profile bootstrap.
 * Used by (app)/_layout and unit tests.
 */
export type AppBootstrapTarget = 'loading' | 'login' | 'wizard' | 'tabs';

export function resolveAppBootstrapTarget(input: {
  authLoading: boolean;
  hasSession: boolean;
  profileLoading: boolean;
  profileFirstName: string | null | undefined;
  pathname: string;
}): AppBootstrapTarget {
  if (input.authLoading) return 'loading';
  if (!input.hasSession) return 'login';
  if (input.profileLoading) return 'loading';

  const profileComplete = Boolean(input.profileFirstName?.trim());

  if (!profileComplete) {
    return input.pathname === '/wizard' ? 'tabs' : 'wizard';
  }

  if (input.pathname === '/wizard') return 'tabs';

  return 'tabs';
}
