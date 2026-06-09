'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function updateProfile(
  firstName: string,
  lastName: string,
  phone: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Niet ingelogd' };

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      phone: phone.trim() || null,
    })
    .eq('id', user.id);

  if (error) return { error: 'Opslaan mislukt. Probeer het opnieuw.' };

  return {};
}
