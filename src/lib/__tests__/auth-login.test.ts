import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockVerifyOtp = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    },
  },
}));

import { isValidOtpCode, verifyEmailOtp } from '@/lib/auth-login';

describe('isValidOtpCode', () => {
  it('accepts exactly six digits', () => {
    expect(isValidOtpCode('123456')).toBe(true);
    expect(isValidOtpCode('12345')).toBe(false);
    expect(isValidOtpCode('1234567')).toBe(false);
    expect(isValidOtpCode('12a456')).toBe(false);
  });
});

describe('verifyEmailOtp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyOtp.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
  });

  it('calls supabase verifyOtp with trimmed email and token', async () => {
    const session = await verifyEmailOtp('  user@example.com  ', ' 654321 ');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '654321',
      type: 'email',
    });
    expect(session?.user.id).toBe('user-1');
  });
});
