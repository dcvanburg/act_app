import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockSetSession = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      setSession: (...args: unknown[]) => mockSetSession(...args),
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    },
  },
}));

import { createSessionFromUrl } from '@/lib/auth-callback';

describe('createSessionFromUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } }, error: null });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: '2' } } },
      error: null,
    });
    mockVerifyOtp.mockResolvedValue({ data: { session: { user: { id: '3' } } }, error: null });
  });

  it('exchanges a PKCE code from the query string', async () => {
    const session = await createSessionFromUrl('actapp://auth/callback?code=pkce-code-123');

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('pkce-code-123');
    expect(session?.user.id).toBe('2');
  });

  it('sets session from implicit-flow hash tokens', async () => {
    const session = await createSessionFromUrl(
      'actapp://auth/callback#access_token=at&refresh_token=rt',
    );

    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'at',
      refresh_token: 'rt',
    });
    expect(session?.user.id).toBe('1');
  });

  it('verifies token_hash magic links', async () => {
    const session = await createSessionFromUrl(
      'actapp://auth/callback?token_hash=abc&type=magiclink',
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: 'abc',
      type: 'magiclink',
    });
    expect(session?.user.id).toBe('3');
  });

  it('throws when Supabase returns an error param', async () => {
    await expect(
      createSessionFromUrl('actapp://auth/callback?error=access_denied&error_description=bad'),
    ).rejects.toThrow('bad');
  });
});
