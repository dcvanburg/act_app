import type { EmailOtpType, Session } from '@supabase/supabase-js';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

import { supabase } from '@/lib/supabase/client';

/**
 * Complete a Supabase auth redirect (magic link / OAuth) from a deep-link URL.
 *
 * Handles PKCE `code`, implicit `access_token`, and `token_hash` flows.
 * @see https://supabase.com/docs/guides/auth/native-mobile-deep-linking
 */
export async function createSessionFromUrl(url: string): Promise<Session | null> {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  if (params.error) {
    throw new Error(params.error_description ?? params.error);
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  if (params.token_hash && params.type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type as EmailOtpType,
    });
    if (error) throw error;
    return data.session;
  }

  return null;
}
