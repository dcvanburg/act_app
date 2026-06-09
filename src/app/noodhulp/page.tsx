import type { Metadata } from 'next';
import Link from 'next/link';
import crisis from '@/content/nl/crisis.json';
import groundingRaw from '@/content/nl/exercises/emergency-grounding.json';
import type { GroundingExercise } from '@/types/content';

// This page is ALWAYS accessible — no auth guard. See middleware.ts.
export const metadata: Metadata = {
  title: 'Noodhulp',
};

const grounding = groundingRaw as GroundingExercise;

export default function NoodhulpPage() {
  return (
    <main className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Back link — only if user might be in the app */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
        >
          ← Terug
        </Link>

        {/* Disclaimer */}
        <div className="mb-6 rounded-xl border border-crisis/30 bg-crisis/5 p-4">
          <h2 className="mb-1 font-semibold text-crisis">{crisis.disclaimer.title}</h2>
          <p className="text-sm text-text-muted">{crisis.disclaimer.body}</p>
        </div>

        {/* Grounding exercise */}
        <h1 className="mb-1 text-xl font-bold text-text">{grounding.title}</h1>
        <p className="mb-6 text-text-muted">{grounding.description}</p>

        <div className="space-y-3">
          {grounding.steps.map((step, i) => (
            <div key={step.id} className="rounded-xl bg-surface p-4 shadow-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary">
                Stap {i + 1}
              </span>
              <p className="text-text">{step.instruction}</p>
            </div>
          ))}
        </div>

        {/* Crisis resources */}
        <section className="mt-10">
          <h2 className="mb-4 font-semibold text-text">{crisis.resources.title}</h2>
          <div className="space-y-3">
            <a
              href={crisis.resources.crisisLine.phoneUri}
              className="flex items-center justify-between rounded-xl bg-surface p-4 shadow-sm hover:bg-primary/5 transition-colors"
            >
              <div>
                <p className="font-semibold text-text">{crisis.resources.crisisLine.name}</p>
                <p className="text-sm text-text-muted">{crisis.resources.crisisLine.description}</p>
              </div>
              <span className="font-bold text-primary">{crisis.resources.crisisLine.phone}</span>
            </a>
            <div className="rounded-xl bg-surface p-4 shadow-sm">
              <p className="font-semibold text-text">{crisis.resources.huisarts.name}</p>
              <p className="text-sm text-text-muted">{crisis.resources.huisarts.description}</p>
            </div>
            <div className="rounded-xl bg-surface p-4 shadow-sm">
              <p className="font-semibold text-text">{crisis.resources.ggz.name}</p>
              <p className="text-sm text-text-muted">{crisis.resources.ggz.description}</p>
            </div>
          </div>
        </section>

        {/* Safety block content */}
        <div className="mt-8 rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
          <strong className="block mb-1 text-text">{crisis.safetyBlock.title}</strong>
          {crisis.safetyBlock.body}
        </div>
      </div>
    </main>
  );
}
