import { describe, expect, it } from 'vitest';
import type { AuthError } from '@supabase/supabase-js';

import {
  DEFAULT_OTP_RATE_LIMIT_SECONDS,
  formatRateLimitMessage,
  isAuthRateLimitError,
  mapSignInOtpError,
  parseRateLimitSeconds,
} from '@/lib/auth-login';

function authError(partial: Partial<AuthError>): AuthError {
  return partial as AuthError;
}

describe('parseRateLimitSeconds', () => {
  it('extracts seconds from Supabase rate-limit message', () => {
    expect(
      parseRateLimitSeconds('For security purposes, you can only request this after 42 seconds.'),
    ).toBe(42);
  });

  it('returns null for unrelated messages', () => {
    expect(parseRateLimitSeconds('Invalid email')).toBeNull();
  });
});

describe('mapSignInOtpError', () => {
  it('maps rate-limit errors with countdown copy', () => {
    const mapped = mapSignInOtpError(
      authError({
        status: 429,
        message: 'For security purposes, you can only request this after 12 seconds.',
        code: 'over_email_send_rate_limit',
      }),
    );

    expect(mapped.kind).toBe('rate_limit');
    if (mapped.kind === 'rate_limit') {
      expect(mapped.retryAfterSeconds).toBe(12);
      expect(mapped.message).toContain('12');
    }
  });

  it('falls back to default seconds for 429 without parsed delay', () => {
    const mapped = mapSignInOtpError(
      authError({
        status: 429,
        message: 'Request rate limit reached',
        code: 'over_request_rate_limit',
      }),
    );

    expect(mapped.kind).toBe('rate_limit');
    if (mapped.kind === 'rate_limit') {
      expect(mapped.retryAfterSeconds).toBe(DEFAULT_OTP_RATE_LIMIT_SECONDS);
    }
  });

  it('maps other errors to generic copy', () => {
    const mapped = mapSignInOtpError(
      authError({
        status: 400,
        message: 'Unable to validate email address: invalid format',
      }),
    );

    expect(mapped).toEqual({ kind: 'generic', message: expect.stringContaining('misgegaan') });
  });
});

describe('isAuthRateLimitError', () => {
  it('detects known rate-limit codes', () => {
    expect(isAuthRateLimitError(authError({ code: 'over_email_send_rate_limit' }))).toBe(true);
  });
});

describe('formatRateLimitMessage', () => {
  it('inserts remaining seconds', () => {
    expect(formatRateLimitMessage(5)).toContain('5');
  });
});
