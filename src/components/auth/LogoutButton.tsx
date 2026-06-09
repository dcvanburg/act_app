'use client';

import { useTransition } from 'react';
import { signOut } from '@/app/actions/account';

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(() => {
          void signOut();
        })
      }
      disabled={isPending}
      className="w-full rounded-xl border border-border py-3 text-sm font-medium text-text-muted hover:bg-surface hover:text-text transition-colors disabled:opacity-60"
    >
      {isPending ? 'Uitloggen…' : 'Uitloggen'}
    </button>
  );
}
