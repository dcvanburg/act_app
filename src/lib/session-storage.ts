import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_ANCHOR_KEY = 'act_session_anchor_iso';
const LAST_ACTIVE_KEY = 'act_last_active_iso';

const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
      }
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };

export async function getSessionAnchor(): Promise<string | null> {
  return storage.getItem(SESSION_ANCHOR_KEY);
}

export async function setSessionAnchor(iso: string): Promise<void> {
  await storage.setItem(SESSION_ANCHOR_KEY, iso);
}

export async function ensureSessionAnchor(now: Date = new Date()): Promise<void> {
  const existing = await getSessionAnchor();
  if (!existing) {
    await setSessionAnchor(now.toISOString());
  }
}

export async function getLastActiveAt(): Promise<string | null> {
  return storage.getItem(LAST_ACTIVE_KEY);
}

export async function setLastActiveAt(iso: string): Promise<void> {
  await storage.setItem(LAST_ACTIVE_KEY, iso);
}

export async function clearSessionPolicyStorage(): Promise<void> {
  await Promise.all([storage.removeItem(SESSION_ANCHOR_KEY), storage.removeItem(LAST_ACTIVE_KEY)]);
}
