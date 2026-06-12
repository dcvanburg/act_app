import { describe, expect, it } from 'vitest';

import {
  computeSessionExpiry,
  isIdleExceeded,
  isOnOnboardingRoute,
  isSessionExpired,
  normalizePathname,
  resolveIdleNavigation,
  resolveOnboardingStartRoute,
  shouldRedirectToHome,
  IDLE_MS,
} from '../session-policy';

describe('normalizePathname', () => {
  it('strips /index suffix', () => {
    expect(normalizePathname('/mood/index')).toBe('/mood');
    expect(normalizePathname('/home/index')).toBe('/home');
  });
});

describe('computeSessionExpiry', () => {
  it('expires at 03:00 Amsterdam on anchor date + 30 days', () => {
    const anchor = '2026-06-01T12:00:00.000Z';
    const expiry = computeSessionExpiry(anchor);

    expect(expiry.toISOString()).toBe('2026-07-01T01:00:00.000Z');
  });

  it('uses Amsterdam calendar date for anchors near midnight UTC', () => {
    const anchor = '2026-01-10T23:30:00.000Z';
    const expiry = computeSessionExpiry(anchor);

    expect(expiry.toISOString()).toBe('2026-02-10T02:00:00.000Z');
  });
});

describe('isSessionExpired', () => {
  it('is false before expiry and true at or after expiry', () => {
    const anchor = '2026-06-01T12:00:00.000Z';
    const before = new Date('2026-07-01T00:59:59.999Z');
    const at = new Date('2026-07-01T01:00:00.000Z');

    expect(isSessionExpired(anchor, before)).toBe(false);
    expect(isSessionExpired(anchor, at)).toBe(true);
  });
});

describe('isIdleExceeded', () => {
  it('returns false when there is no prior activity timestamp', () => {
    expect(isIdleExceeded(null)).toBe(false);
  });

  it('returns true after the idle threshold', () => {
    const lastActive = new Date('2026-06-01T12:00:00.000Z');
    const now = new Date(lastActive.getTime() + IDLE_MS);
    expect(isIdleExceeded(lastActive.toISOString(), now)).toBe(true);
  });
});

describe('isOnOnboardingRoute', () => {
  it('matches onboarding funnel routes', () => {
    expect(isOnOnboardingRoute('/wizard')).toBe(true);
    expect(isOnOnboardingRoute('/onboarding')).toBe(true);
    expect(isOnOnboardingRoute('/mood', 'onboarding')).toBe(true);
    expect(isOnOnboardingRoute('/modules/onboarding', 'onboarding')).toBe(true);
  });

  it('does not match module onboarding without from=onboarding', () => {
    expect(isOnOnboardingRoute('/modules/onboarding')).toBe(false);
  });
});

describe('resolveOnboardingStartRoute', () => {
  it('starts at wizard when profile is incomplete', () => {
    expect(resolveOnboardingStartRoute(null)).toBe('/wizard');
    expect(resolveOnboardingStartRoute('')).toBe('/wizard');
  });

  it('starts at mood when profile has a first name', () => {
    expect(resolveOnboardingStartRoute('Jan')).toBe('/mood?from=onboarding');
  });
});

describe('shouldRedirectToHome', () => {
  it('skips home, crisis, auth, and landing routes', () => {
    expect(shouldRedirectToHome('/home')).toBe(false);
    expect(shouldRedirectToHome('/noodhulp')).toBe(false);
    expect(shouldRedirectToHome('/login')).toBe(false);
    expect(shouldRedirectToHome('/auth/callback')).toBe(false);
    expect(shouldRedirectToHome('/')).toBe(false);
  });

  it('redirects other app routes', () => {
    expect(shouldRedirectToHome('/modules/recognition')).toBe(true);
    expect(shouldRedirectToHome('/account')).toBe(true);
  });
});

describe('resolveIdleNavigation', () => {
  it('resets onboarding when idle on onboarding pages with module 0 incomplete', () => {
    expect(
      resolveIdleNavigation({
        isOnOnboarding: true,
        onboardingModuleCompleted: false,
        pathname: '/modules/onboarding',
      }),
    ).toBe('onboarding_start');
  });

  it('goes home by default when not on onboarding pages', () => {
    expect(
      resolveIdleNavigation({
        isOnOnboarding: false,
        onboardingModuleCompleted: false,
        pathname: '/modules/recognition',
      }),
    ).toBe('home');
  });

  it('does nothing when already on home', () => {
    expect(
      resolveIdleNavigation({
        isOnOnboarding: false,
        onboardingModuleCompleted: false,
        pathname: '/home',
      }),
    ).toBe('none');
  });
});
