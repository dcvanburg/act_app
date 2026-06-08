import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDefaultProgress } from '@/lib/progress';
import { ProgramOverview } from '@/components/modules/ProgramOverview';
import type { UserProgress } from '@/types/content';
import common from '@/content/nl/common.json';

export const metadata: Metadata = {
  title: 'Programma',
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: row } = await supabase
    .from('user_progress')
    .select('progress')
    .eq('user_id', user.id)
    .single();

  const progress: UserProgress = (row?.progress as UserProgress | null) ?? getDefaultProgress();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8 pb-28">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">{common.app.name}</h1>
            <p className="mt-1 text-sm text-text-muted">{common.app.tagline}</p>
          </div>
          <Link
            href="/account"
            aria-label="Mijn account"
            className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </Link>
        </header>
        <ProgramOverview progress={progress} />
      </div>
    </main>
  );
}
