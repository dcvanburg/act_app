'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/app/actions/account';
import { cn } from '@/lib/utils';

interface Props {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export function EditProfileForm({ firstName, lastName, phone }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [first, setFirst] = useState(firstName ?? '');
  const [last, setLast] = useState(lastName ?? '');
  const [tel, setTel] = useState(phone ?? '');

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || '—';

  function handleCancel() {
    setFirst(firstName ?? '');
    setLast(lastName ?? '');
    setTel(phone ?? '');
    setError(null);
    setEditing(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(first, last, tel);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  if (!editing) {
    return (
      <div className="rounded-xl bg-surface shadow-sm divide-y divide-border">
        <Row label="Volledige naam" value={fullName} />
        <Row label="Telefoonnummer" value={phone ?? '—'} />
        <div className="px-6 py-4">
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Gegevens bewerken
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="rounded-xl bg-surface shadow-sm p-6 space-y-4">
      <p className="text-sm font-semibold text-text">Gegevens bewerken</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="editFirst" className="mb-1 block text-xs font-medium text-text-muted">
            Voornaam
          </label>
          <input
            id="editFirst"
            type="text"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            required
            autoComplete="given-name"
            placeholder="Jan"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="editLast" className="mb-1 block text-xs font-medium text-text-muted">
            Achternaam
          </label>
          <input
            id="editLast"
            type="text"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            required
            autoComplete="family-name"
            placeholder="de Vries"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="editPhone" className="mb-1 block text-xs font-medium text-text-muted">
          Telefoonnummer
        </label>
        <input
          id="editPhone"
          type="tel"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          required
          autoComplete="tel"
          placeholder="06 12345678"
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-crisis">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white',
            'hover:bg-primary-dark transition-colors disabled:opacity-60',
          )}
        >
          {isPending ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-text-muted hover:text-text transition-colors disabled:opacity-60"
        >
          Annuleren
        </button>
      </div>
    </form>
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
