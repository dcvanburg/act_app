import { isoDate } from '@/lib/mood';
import { supabase } from '@/lib/supabase/client';
import { EMPTY_WAARDEN_DATA, normalizeWaardeDatum, normalizeWaardenData } from '@/lib/waarden';
import { clearWaardenLocalStorage, loadWaardenData } from '@/lib/waarden-storage';
import type {
  Waarde,
  WaardeActie,
  WaardeActieBeoordeling,
  WaardeBarriere,
  WaardeCheckin,
  WaardenData,
} from '@/types/waarden';

async function ensureProfile(userId: string, email: string | null | undefined): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: email ?? null }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw error;
}

function mapWaarde(row: { id: string; naam: string; beschrijving: string; kleur: string }): Waarde {
  return {
    id: row.id,
    naam: row.naam,
    beschrijving: row.beschrijving ?? '',
    kleur: row.kleur,
  };
}

function mapActie(row: {
  id: string;
  waarde_id: string;
  termijn: string;
  actie: string;
  aangemaakt_op: string;
  beoordeling: WaardeActieBeoordeling | null;
}): WaardeActie {
  return {
    id: row.id,
    waarde_id: row.waarde_id,
    termijn: row.termijn as WaardeActie['termijn'],
    actie: row.actie,
    aangemaakt_op: row.aangemaakt_op,
    beoordeling: row.beoordeling ?? undefined,
  };
}

function mapBarriere(row: {
  id: string;
  waarde_id: string;
  type: string;
  eigen_label: string | null;
  omschrijving: string;
  aangemaakt_op: string | null;
  created_at?: string;
}): WaardeBarriere {
  const aangemaakt_op = row.aangemaakt_op
    ? normalizeWaardeDatum(row.aangemaakt_op)
    : row.created_at
      ? normalizeWaardeDatum(row.created_at.slice(0, 10))
      : isoDate();

  return {
    id: row.id,
    waarde_id: row.waarde_id,
    type: row.type as WaardeBarriere['type'],
    omschrijving: row.omschrijving,
    aangemaakt_op,
    ...(row.eigen_label ? { eigenLabel: row.eigen_label } : {}),
  };
}

function mapCheckin(row: {
  id: string;
  waarde_id: string;
  datum: string;
  antwoord: string;
  notitie: string;
}): WaardeCheckin {
  return {
    id: row.id,
    waarde_id: row.waarde_id,
    datum: normalizeWaardeDatum(row.datum),
    antwoord: row.antwoord as WaardeCheckin['antwoord'],
    notitie: row.notitie ?? '',
  };
}

/** Load all waarden data for the signed-in user from Supabase. */
export async function fetchWaardenData(userId: string): Promise<WaardenData> {
  const [waardenRes, actiesRes, barriersRes, checkinsRes] = await Promise.all([
    supabase
      .from('waarden')
      .select('id, naam, beschrijving, kleur')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('waarde_acties')
      .select('id, waarde_id, termijn, actie, aangemaakt_op, beoordeling')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('waarde_barriers')
      .select('id, waarde_id, type, eigen_label, omschrijving, aangemaakt_op, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('waarde_checkins')
      .select('id, waarde_id, datum, antwoord, notitie')
      .eq('user_id', userId)
      .order('datum', { ascending: true }),
  ]);

  if (waardenRes.error) throw waardenRes.error;
  if (actiesRes.error) throw actiesRes.error;
  if (barriersRes.error) throw barriersRes.error;
  if (checkinsRes.error) throw checkinsRes.error;

  return normalizeWaardenData({
    waarden: (waardenRes.data ?? []).map(mapWaarde),
    acties: (actiesRes.data ?? []).map(mapActie),
    barriers: (barriersRes.data ?? []).map(mapBarriere),
    checkins: (checkinsRes.data ?? []).map(mapCheckin),
  });
}

function hasWaardenData(data: WaardenData): boolean {
  return (
    data.waarden.length > 0 ||
    data.acties.length > 0 ||
    data.barriers.length > 0 ||
    data.checkins.length > 0
  );
}

/** One-time upload of device-local waarden data when Supabase is still empty. */
async function bulkInsertWaardenData(
  userId: string,
  data: WaardenData,
  email: string | null | undefined,
): Promise<void> {
  await ensureProfile(userId, email);

  if (data.waarden.length > 0) {
    const { error } = await supabase.from('waarden').insert(
      data.waarden.map((item) => ({
        id: item.id,
        user_id: userId,
        naam: item.naam,
        beschrijving: item.beschrijving,
        kleur: item.kleur,
      })),
    );
    if (error) throw error;
  }

  if (data.acties.length > 0) {
    const { error } = await supabase.from('waarde_acties').insert(
      data.acties.map((item) => ({
        id: item.id,
        user_id: userId,
        waarde_id: item.waarde_id,
        termijn: item.termijn,
        actie: item.actie,
        aangemaakt_op: item.aangemaakt_op,
        beoordeling: item.beoordeling ?? null,
      })),
    );
    if (error) throw error;
  }

  if (data.barriers.length > 0) {
    const { error } = await supabase.from('waarde_barriers').insert(
      data.barriers.map((item) => ({
        id: item.id,
        user_id: userId,
        waarde_id: item.waarde_id,
        type: item.type,
        eigen_label: item.eigenLabel ?? null,
        omschrijving: item.omschrijving,
        aangemaakt_op: item.aangemaakt_op,
      })),
    );
    if (error) throw error;
  }

  if (data.checkins.length > 0) {
    const { error } = await supabase.from('waarde_checkins').insert(
      data.checkins.map((item) => ({
        id: item.id,
        user_id: userId,
        waarde_id: item.waarde_id,
        datum: item.datum,
        antwoord: item.antwoord,
        notitie: item.notitie,
      })),
    );
    if (error) throw error;
  }
}

/**
 * Load waarden from Supabase; migrate legacy AsyncStorage data once when remote
 * is empty and local data exists.
 */
export async function loadWaardenWithMigration(
  userId: string,
  email: string | null | undefined,
): Promise<WaardenData> {
  const remote = await fetchWaardenData(userId);
  if (hasWaardenData(remote)) {
    return remote;
  }

  const local = normalizeWaardenData(await loadWaardenData(userId));
  if (!hasWaardenData(local)) {
    return EMPTY_WAARDEN_DATA;
  }

  await bulkInsertWaardenData(userId, local, email);
  await clearWaardenLocalStorage(userId);
  return local;
}

export async function insertWaarde(
  userId: string,
  email: string | null | undefined,
  waarde: Waarde,
): Promise<void> {
  await ensureProfile(userId, email);
  const { error } = await supabase.from('waarden').insert({
    id: waarde.id,
    user_id: userId,
    naam: waarde.naam,
    beschrijving: waarde.beschrijving,
    kleur: waarde.kleur,
  });
  if (error) throw error;
}

export async function updateWaardeRemote(userId: string, waarde: Waarde): Promise<void> {
  const { error } = await supabase
    .from('waarden')
    .update({
      naam: waarde.naam,
      beschrijving: waarde.beschrijving,
      kleur: waarde.kleur,
    })
    .eq('user_id', userId)
    .eq('id', waarde.id);
  if (error) throw error;
}

export async function deleteWaardeRemote(userId: string, waardeId: string): Promise<void> {
  const { error } = await supabase
    .from('waarden')
    .delete()
    .eq('user_id', userId)
    .eq('id', waardeId);
  if (error) throw error;
}

export async function insertActie(
  userId: string,
  email: string | null | undefined,
  actie: WaardeActie,
): Promise<void> {
  await ensureProfile(userId, email);
  const { error } = await supabase.from('waarde_acties').insert({
    id: actie.id,
    user_id: userId,
    waarde_id: actie.waarde_id,
    termijn: actie.termijn,
    actie: actie.actie,
    aangemaakt_op: actie.aangemaakt_op,
    beoordeling: actie.beoordeling ?? null,
  });
  if (error) throw error;
}

export async function updateActieRemote(userId: string, actie: WaardeActie): Promise<void> {
  const { error } = await supabase
    .from('waarde_acties')
    .update({
      termijn: actie.termijn,
      actie: actie.actie,
      aangemaakt_op: actie.aangemaakt_op,
      beoordeling: actie.beoordeling ?? null,
    })
    .eq('user_id', userId)
    .eq('id', actie.id);
  if (error) throw error;
}

export async function deleteActieRemote(userId: string, actieId: string): Promise<void> {
  const { error } = await supabase
    .from('waarde_acties')
    .delete()
    .eq('user_id', userId)
    .eq('id', actieId);
  if (error) throw error;
}

export async function insertBarriere(
  userId: string,
  email: string | null | undefined,
  barriere: WaardeBarriere,
): Promise<void> {
  await ensureProfile(userId, email);
  const { error } = await supabase.from('waarde_barriers').insert({
    id: barriere.id,
    user_id: userId,
    waarde_id: barriere.waarde_id,
    type: barriere.type,
    eigen_label: barriere.eigenLabel ?? null,
    omschrijving: barriere.omschrijving,
    aangemaakt_op: barriere.aangemaakt_op,
  });
  if (error) throw error;
}

export async function updateBarriereRemote(
  userId: string,
  barriere: WaardeBarriere,
): Promise<void> {
  const { error } = await supabase
    .from('waarde_barriers')
    .update({
      type: barriere.type,
      eigen_label: barriere.eigenLabel ?? null,
      omschrijving: barriere.omschrijving,
    })
    .eq('user_id', userId)
    .eq('id', barriere.id);
  if (error) throw error;
}

export async function deleteBarriereRemote(userId: string, barriereId: string): Promise<void> {
  const { error } = await supabase
    .from('waarde_barriers')
    .delete()
    .eq('user_id', userId)
    .eq('id', barriereId);
  if (error) throw error;
}

export async function upsertCheckinRemote(
  userId: string,
  email: string | null | undefined,
  checkin: WaardeCheckin,
): Promise<void> {
  await ensureProfile(userId, email);
  const { error: deleteError } = await supabase
    .from('waarde_checkins')
    .delete()
    .eq('user_id', userId)
    .eq('waarde_id', checkin.waarde_id)
    .eq('datum', checkin.datum);
  if (deleteError) throw deleteError;

  const { error } = await supabase.from('waarde_checkins').insert({
    id: checkin.id,
    user_id: userId,
    waarde_id: checkin.waarde_id,
    datum: checkin.datum,
    antwoord: checkin.antwoord,
    notitie: checkin.notitie,
  });
  if (error) throw error;
}
