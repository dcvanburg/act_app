import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import common from '@/content/nl/common.json';

export const metadata: Metadata = {
  title: 'Inloggen',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text">{common.app.name}</h1>
          <p className="mt-1 text-text-muted">{common.app.tagline}</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-text-muted">
          Dit programma is geen vervanging voor professionele hulp.{' '}
          <a href="/noodhulp" className="underline hover:text-primary">
            Noodhulp?
          </a>
        </p>
      </div>
    </main>
  );
}
