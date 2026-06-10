import { createClient } from '@supabase/supabase-js';

import { secureStorage } from './secure-storage';

/**
 * Supabase client for the Expo app.
 *
 * - Tokens are persisted in `expo-secure-store` (Keychain on iOS, hardware-
 *   backed Keystore on Android when available) via a chunked adapter that
 *   splits values above the 2KB platform limit. Web falls back to AsyncStorage
 *   because SecureStore is unavailable.
 * - `detectSessionInUrl: false` — Supabase's built-in URL parser assumes a
 *   browser. We handle the magic-link deep link manually in AuthProvider.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const SUPABASE_CONFIGURED = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
