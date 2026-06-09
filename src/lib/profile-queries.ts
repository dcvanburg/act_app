import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  subscription_tier: string | null;
  created_at: string;
}

const PROFILE_KEY = (userId: string | undefined) => ['profile', userId];

/**
 * useProfile — load the profile row for the signed-in user.
 *
 * The row is upserted on first save (see useSaveModuleProgress and
 * useSaveIntake), so brand-new users may have no row yet. We return null
 * in that case rather than throwing.
 */
export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: PROFILE_KEY(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, subscription_tier, created_at')
        .eq('id', user.id)
        .maybeSingle<Profile>();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export interface ProfileUpdate {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

/**
 * useUpdateProfile — partial update of the user's profile.
 *
 * Upserts the row so a brand-new user (no profile row yet) gets one created
 * with their email + the supplied fields. ignoreDuplicates is intentionally
 * NOT used here — we want the update to take effect even if the row exists.
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: ProfileUpdate): Promise<Profile> => {
      if (!user) throw new Error('Niet ingelogd');

      const payload = {
        id: user.id,
        email: user.email ?? null,
        first_name: update.first_name?.trim() || null,
        last_name: update.last_name?.trim() || null,
        phone: update.phone?.trim() || null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('id, email, first_name, last_name, phone, subscription_tier, created_at')
        .single<Profile>();

      if (error) throw error;
      if (!data) throw new Error('Profile not returned from upsert');
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_KEY(user?.id), data);
    },
  });
}

/**
 * useDeleteAccount — GDPR right-to-erasure.
 *
 * Deleting the `profiles` row cascades to `user_progress` and `journal_entries`
 * via the ON DELETE CASCADE FKs in 0001_initial_schema.sql. After the delete,
 * we sign the user out so the local SecureStore session is wiped.
 *
 * Known gap: this does NOT delete the `auth.users` row. Doing so requires the
 * service-role key, which is server-side only — implementing it cleanly needs
 * a Supabase Edge Function. Until that lands, the auth.users row remains
 * (just the email + auth hashes — no Article 9 data). Acceptable for v1 per
 * docs/SECURITY.md; revisit before the pilot.
 */
export function useDeleteAccount() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user) throw new Error('Niet ingelogd');

      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;

      // Wipe local caches before signOut so a re-login after deletion doesn't
      // see stale data flash.
      queryClient.clear();
      await signOut();
    },
  });
}
