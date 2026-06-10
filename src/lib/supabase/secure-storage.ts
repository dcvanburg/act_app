import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Chunked SecureStore adapter for the Supabase auth client.
 *
 * `expo-secure-store` stores each value in a single Keychain (iOS) / Keystore
 * (Android) item. The platform limit is **2048 bytes per value** — SDK 51
 * currently warns above this and may throw in future SDKs.
 *
 * Supabase access tokens are JWTs that comfortably exceed 2KB once a few
 * claims are attached, so we transparently split the value across multiple
 * SecureStore entries:
 *
 *   key             — meta: total chunks (e.g. "3"), or absent if single-chunk
 *   key.0, key.1…   — each holding ≤ CHUNK_SIZE characters
 *
 * Backwards-compatible with values written by older single-key code.
 *
 * Web (Expo for Web in dev) has no SecureStore, so we fall back to
 * AsyncStorage there. The app shouldn't run on web in production — AVG
 * Article 9 storage requirements rule out browser localStorage — but the
 * fallback keeps dev tooling alive.
 */

const CHUNK_SIZE = 1800; // safety margin under the 2048-byte limit (UTF-16)
const COUNT_SUFFIX = '__chunks';

async function getChunked(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`);
  if (countRaw === null) {
    // Either it was never written, OR it fits in a single key (legacy / small).
    return SecureStore.getItemAsync(key);
  }
  const count = Number.parseInt(countRaw, 10);
  if (!Number.isFinite(count) || count <= 0) return null;

  const parts = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)),
  );
  if (parts.some((p) => p === null)) return null;
  return parts.join('');
}

async function setChunked(key: string, value: string): Promise<void> {
  // Always clear the legacy single-key entry so we don't leave stale data.
  await SecureStore.deleteItemAsync(key);

  if (value.length <= CHUNK_SIZE) {
    // Small enough — single key, no count marker. Clear any prior chunks.
    await clearChunks(key);
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const count = Math.ceil(value.length / CHUNK_SIZE);

  // Write count FIRST so a torn write surfaces as "missing chunk" not "stale".
  await SecureStore.setItemAsync(`${key}${COUNT_SUFFIX}`, String(count));
  for (let i = 0; i < count; i++) {
    const slice = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}.${i}`, slice);
  }
}

async function clearChunks(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`);
  if (countRaw === null) return;
  const count = Number.parseInt(countRaw, 10);
  await SecureStore.deleteItemAsync(`${key}${COUNT_SUFFIX}`);
  if (!Number.isFinite(count) || count <= 0) return;
  await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)),
  );
}

async function removeChunked(key: string): Promise<void> {
  await Promise.all([SecureStore.deleteItemAsync(key), clearChunks(key)]);
}

const ChunkedSecureStore = {
  getItem: getChunked,
  setItem: setChunked,
  removeItem: removeChunked,
};

export const secureStorage = Platform.OS === 'web' ? AsyncStorage : ChunkedSecureStore;
