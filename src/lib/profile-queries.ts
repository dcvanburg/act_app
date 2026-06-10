import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { clearWaardenLocalStorage } from '@/lib/waarden-storage';
import { useAuth } from '@/providers/AuthProvider';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  referral_source: string | null;
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
        .select('id, email, first_name, last_name, phone, referral_source, created_at')
        .eq('id', user.id)
        .maybeSingle<Omit<Profile, 'subscription_tier'>>();
      if (error) throw error;
      return data ? { ...data, subscription_tier: 'free' } : null;
    },
  });
}

export interface ProfileUpdate {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  referral_source?: string | null;
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
        referral_source: update.referral_source ?? null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('id, email, first_name, last_name, phone, referral_source, created_at')
        .single<Omit<Profile, 'subscription_tier'>>();

      if (error) throw error;
      if (!data) throw new Error('Profile not returned from upsert');
      return { ...data, subscription_tier: 'free' };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_KEY(user?.id), data);
    },
  });
}

/**
 * useDeleteAccount — GDPR right-to-erasure.
 *
 * Sequence:
 *   1. Call the `delete-user` Edge Function — uses service-role key to delete
 *      the auth.users row, which cascades to all app data via ON DELETE CASCADE.
 *   2. Clear the local AsyncStorage waarden cache so loadWaardenWithMigration
 *      cannot re-migrate stale local data on the next login.
 *   3. Wipe TanStack Query cache and sign out (clears SecureStore session).
 */
export function useDeleteAccount() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user) throw new Error('Niet ingelogd');

      const { error } = await supabase.functions.invoke('delete-user');
      if (error) throw error;

      await clearWaardenLocalStorage(user.id);
      queryClient.clear();
      await signOut();
    },
  });
}
