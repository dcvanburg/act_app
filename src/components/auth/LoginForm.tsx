'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Step = 'email' | 'details' | 'sent';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

const primaryBtn = cn(
  'w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white',
  'hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  'disabled:opacity-60 disabled:cursor-not-allowed transition-colors',
);

export function LoginForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: check if email exists ─────────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Try sending OTP without creating the user.
    // If this succeeds → email exists → OTP already sent → show confirmation.
    // If this fails   → email is new → ask for personal details first.
    const { error: checkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    setLoading(false);

    if (!checkError) {
      setStep('sent');
    } else {
      // Treat any error as "user not found" — ask for details.
      // If Supabase itself is misconfigured the next step will surface the real error.
      setStep('details');
    }
  }

  // ── Step 2: create new account ────────────────────────────────────────────
  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
        },
      },
    });

    setLoading(false);

    if (otpError) {
      setError('Er is iets misgegaan. Controleer het e-mailadres en probeer opnieuw.');
      return;
    }

    setStep('sent');
  }

  // ── Sent confirmation ─────────────────────────────────────────────────────
  if (step === 'sent') {
    return (
      <div className="rounded-xl bg-surface p-6 shadow-sm">
        <h2 className="mb-2 font-semibold text-text">Controleer je e-mail</h2>
        <p className="text-sm text-text-muted">
          We hebben een inloglink gestuurd naar{' '}
          <span className="font-medium text-text">{email}</span>. Klik op de link om verder te gaan.
        </p>
      </div>
    );
  }

  // ── New user: personal details ────────────────────────────────────────────
  if (step === 'details') {
    return (
      <form
        onSubmit={handleDetailsSubmit}
        className="rounded-xl bg-surface p-6 shadow-sm space-y-4"
      >
        <div>
          <h2 className="font-semibold text-text">Nieuw account aanmaken</h2>
          <p className="mt-1 text-sm text-text-muted">Vul je gegevens in om verder te gaan.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-text">
              Voornaam
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirst(e.target.value)}
              required
              autoComplete="given-name"
              placeholder="Jan"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-text">
              Achternaam
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLast(e.target.value)}
              required
              autoComplete="family-name"
              placeholder="de Vries"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-text">
            Telefoonnummer
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            placeholder="06 12345678"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-crisis">{error}</p>}

        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? 'Bezig…' : 'Account aanmaken'}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep('email');
            setError(null);
          }}
          className="w-full text-sm text-text-muted hover:text-text transition-colors"
        >
          ← Ander e-mailadres gebruiken
        </button>
      </form>
    );
  }

  // ── Step 1: email ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleEmailSubmit} className="rounded-xl bg-surface p-6 shadow-sm space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-text">
          E-mailadres
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="jouw@email.nl"
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-crisis">{error}</p>}

      <button type="submit" disabled={loading} className={primaryBtn}>
        {loading ? 'Bezig…' : 'Doorgaan'}
      </button>
    </form>
  );
}
