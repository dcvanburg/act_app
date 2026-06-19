import type { AuthError } from '@supabase/supabase-js';

import auth from '@/content/nl/auth.json';

/** Default per-user OTP cooldown when Supabase returns 429 without a parsed delay. */
export const DEFAULT_OTP_RATE_LIMIT_SECONDS = 60;

const RATE_LIMIT_MESSAGE_PATTERN = /after (\d+) seconds?/i;

const RATE_LIMIT_ERROR_CODES = new Set([
  'over_email_send_rate_limit',
  'over_sms_send_rate_limit',
  'over_request_rate_limit',
]);

export type AuthLoginError =
  | { kind: 'rate_limit'; retryAfterSeconds: number; message: string }
  | { kind: 'generic'; message: string };

/** Parse "… after N seconds" from Supabase Auth rate-limit responses. */
export function parseRateLimitSeconds(message: string | undefined): number | null {
  if (!message) return null;
  const match = RATE_LIMIT_MESSAGE_PATTERN.exec(message);
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export function isAuthRateLimitError(error: Pick<AuthError, 'message' | 'status' | 'code'>): boolean {
  if (error.status === 429) return true;
  if (error.code && RATE_LIMIT_ERROR_CODES.has(error.code)) return true;
  return parseRateLimitSeconds(error.message) !== null;
}

/** Map signInWithOtp / resend errors to Dutch user-facing copy. */
export function mapSignInOtpError(error: AuthError | null | undefined): AuthLoginError {
  if (!error) {
    return { kind: 'generic', message: auth.errors.generic };
  }

  if (!isAuthRateLimitError(error)) {
    return { kind: 'generic', message: auth.errors.generic };
  }

  const retryAfterSeconds =
    parseRateLimitSeconds(error.message) ?? DEFAULT_OTP_RATE_LIMIT_SECONDS;

  return {
    kind: 'rate_limit',
    retryAfterSeconds,
    message: formatRateLimitMessage(retryAfterSeconds),
  };
}

export function formatRateLimitMessage(seconds: number): string {
  return auth.errors.rateLimitCountdown.replace('{seconds}', String(seconds));
}
