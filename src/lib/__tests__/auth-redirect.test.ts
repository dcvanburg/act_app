import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-auth-session', () => ({
  makeRedirectUri: vi.fn(() => 'actapp://auth/callback'),
}));

import { getAuthRedirectUrl } from '@/lib/auth-redirect';

describe('getAuthRedirectUrl', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.stubGlobal('__DEV__', false);
  });

  it('uses EXPO_PUBLIC_AUTH_CALLBACK_URL when set', () => {
    process.env.EXPO_PUBLIC_AUTH_CALLBACK_URL =
      'https://project.supabase.co/functions/v1/auth-callback';
    expect(getAuthRedirectUrl()).toBe('https://project.supabase.co/functions/v1/auth-callback');
  });

  it('derives the bridge URL from EXPO_PUBLIC_SUPABASE_URL in production', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.supabase.co/';
    vi.stubGlobal('__DEV__', false);
    expect(getAuthRedirectUrl()).toBe('https://project.supabase.co/functions/v1/auth-callback');
  });

  it('uses makeRedirectUri in development', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    vi.stubGlobal('__DEV__', true);
    expect(getAuthRedirectUrl()).toBe('actapp://auth/callback');
  });
});
