import { describe, expect, it } from 'vitest';

import { resolveAppBootstrapTarget } from '@/lib/auth-bootstrap';

describe('resolveAppBootstrapTarget', () => {
  it('shows login when there is no session', () => {
    expect(
      resolveAppBootstrapTarget({
        authLoading: false,
        hasSession: false,
        profileLoading: false,
        profileFirstName: null,
        pathname: '/home',
      }),
    ).toBe('login');
  });

  it('redirects incomplete profiles to wizard', () => {
    expect(
      resolveAppBootstrapTarget({
        authLoading: false,
        hasSession: true,
        profileLoading: false,
        profileFirstName: null,
        pathname: '/home',
      }),
    ).toBe('wizard');
  });

  it('keeps incomplete profiles on the wizard screen', () => {
    expect(
      resolveAppBootstrapTarget({
        authLoading: false,
        hasSession: true,
        profileLoading: false,
        profileFirstName: null,
        pathname: '/wizard',
      }),
    ).toBe('tabs');
  });

  it('shows tabs for completed profiles', () => {
    expect(
      resolveAppBootstrapTarget({
        authLoading: false,
        hasSession: true,
        profileLoading: false,
        profileFirstName: 'Jan',
        pathname: '/home',
      }),
    ).toBe('tabs');
  });
});
