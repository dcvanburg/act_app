import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Create profile row for new users — includes name if provided during registration.
      // ignoreDuplicates: true means existing profiles are never overwritten on re-login.
      const meta = data.user.user_metadata ?? {};
      await supabase.from('profiles').upsert(
        {
          id:         data.user.id,
          email:      data.user.email ?? null,
          first_name: typeof meta['first_name'] === 'string' ? meta['first_name'] : null,
          last_name:  typeof meta['last_name']  === 'string' ? meta['last_name']  : null,
          phone:      typeof meta['phone']       === 'string' ? meta['phone']      : null,
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );
      return NextResponse.redirect(`${origin}/home`);
    }
  }

  // Auth failed — redirect to login with error indicator
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
