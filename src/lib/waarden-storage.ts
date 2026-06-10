import AsyncStorage from '@react-native-async-storage/async-storage';

import { EMPTY_WAARDEN_DATA, normalizeWaardenData } from '@/lib/waarden';
import type { WaardeCheckin, WaardeCheckinAntwoord, WaardenData } from '@/types/waarden';

type LegacyCheckin = WaardeCheckin & { gehandeld?: boolean };

function isAntwoord(value: unknown): value is WaardeCheckinAntwoord {
  return value === 'ja' || value === 'neutraal' || value === 'nee';
}

function normalizeCheckin(raw: LegacyCheckin): WaardeCheckin {
  if (isAntwoord(raw.antwoord)) {
    return {
      id: raw.id,
      waarde_id: raw.waarde_id,
      datum: raw.datum,
      antwoord: raw.antwoord,
      notitie: raw.notitie ?? '',
    };
  }
  const antwoord: WaardeCheckinAntwoord = raw.gehandeld ? 'ja' : 'nee';
  return {
    id: raw.id,
    waarde_id: raw.waarde_id,
    datum: raw.datum,
    antwoord,
    notitie: raw.notitie ?? '',
  };
}

const STORAGE_PREFIX = 'waarden-app-v1';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export async function loadWaardenData(userId: string): Promise<WaardenData> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return { ...EMPTY_WAARDEN_DATA };
  try {
    const parsed = JSON.parse(raw) as WaardenData;
    return normalizeWaardenData({
      waarden: parsed.waarden ?? [],
      acties: parsed.acties ?? [],
      barriers: parsed.barriers ?? [],
      checkins: (parsed.checkins ?? []).map((item) => normalizeCheckin(item as LegacyCheckin)),
    });
  } catch {
    return { ...EMPTY_WAARDEN_DATA };
  }
}

/** @deprecated Waarden persist in Supabase — kept for one-time local migration. */
export async function saveWaardenData(userId: string, data: WaardenData): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(data));
}

/** Remove legacy device storage after a successful Supabase migration. */
export async function clearWaardenLocalStorage(userId: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(userId));
}
