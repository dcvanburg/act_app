import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { EditProfileForm } from '@/components/auth/EditProfileForm';

export const metadata: Metadata = {
  title: 'Mijn account',
};

type ProfileRow = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name, phone, created_at')
    .eq('id', user.id)
    .single<ProfileRow>();

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || null;

  const email   = profile?.email ?? user.email ?? null;
  const initial = (fullName ?? email ?? '?').charAt(0).toUpperCase();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8 pb-28 space-y-4">

        {/* Header */}
        <header className="flex items-center gap-3 mb-4">
          <Link
            href="/home"
            aria-label="Terug naar programma"
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-text">Mijn account</h1>
        </header>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 rounded-xl bg-surface p-6 shadow-sm">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="text-2xl font-bold text-primary">{initial}</span>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-text leading-snug">{fullName ?? '—'}</p>
            <p className="text-sm text-text-muted truncate">{email}</p>
          </div>
        </div>

        {/* Editable fields: naam + telefoon */}
        <EditProfileForm
          firstName={profile?.first_name ?? null}
          lastName={profile?.last_name ?? null}
          phone={profile?.phone ?? null}
        />

        {/* Read-only details */}
        <div className="rounded-xl bg-surface shadow-sm divide-y divide-border">
          <Row label="E-mailadres"  value={email ?? '—'} />
          {memberSince && <Row label="Lid sinds"  value={memberSince} />}
          <Row label="Abonnement"   value="Gratis pilot" />
        </div>

        {/* Logout */}
        <LogoutButton />

      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text text-right max-w-[60%] break-all">{value}</span>
    </div>
  );
}
