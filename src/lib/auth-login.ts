import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';

/** Verify the 6-digit code from the Supabase magic-link email. */
export async function verifyEmailOtp(email: string, token: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  });

  if (error) throw error;
  return data.session;
}

export function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
