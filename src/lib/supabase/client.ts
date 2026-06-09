import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Supabase client for the Expo app.
 *
 * - Tokens are persisted in `expo-secure-store` on iOS/Android (Keychain on
 *   iOS, hardware-backed Keystore on Android when available). Web (Expo for
 *   Web in dev) falls back to AsyncStorage because SecureStore is unavailable.
 * - `detectSessionInUrl: false` — Supabase's built-in URL parser assumes a
 *   browser. We handle the magic-link deep link manually in AuthProvider.
 * - Magic-link tokens fit comfortably under the SecureStore 2KB-per-value
 *   limit; we do not split them.
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const storage = Platform.OS === 'web' ? AsyncStorage : SecureStoreAdapter;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const SUPABASE_CONFIGURED = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
