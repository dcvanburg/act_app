import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import common from '@/content/nl/common.json';

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated users go straight to the program
  if (user) redirect('/home');

  // Landing page for unauthenticated visitors
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-3xl font-bold text-text">{common.app.name}</h1>
        <p className="mb-8 text-lg text-text-muted">{common.app.tagline}</p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-primary px-8 py-3 font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          {common.actions.start}
        </Link>
        <p className="mt-8 text-xs text-text-muted">
          Heb je hulp nodig?{' '}
          <a href="/noodhulp" className="underline hover:text-primary">
            Ga naar noodhulp
          </a>
        </p>
      </div>
    </main>
  );
}
