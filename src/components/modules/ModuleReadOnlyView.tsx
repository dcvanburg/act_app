import Link from 'next/link';
import type { ModuleContent, ComplaintType } from '@/types/content';

interface Props {
  content: ModuleContent;
  complaintTypes: ComplaintType[];
}

// Completed module revisit — single scrollable page, no pagination.
// See docs/NAVIGATION.md: revisit behavior.
export function ModuleReadOnlyView({ content, complaintTypes }: Props) {
  const primaryComplaint = complaintTypes[0] ?? null;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href="/home"
            aria-label="Terug naar overzicht"
            className="rounded-lg p-1.5 text-text-muted hover:bg-background hover:text-text"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="flex-1">
            <p className="text-xs font-medium text-text-muted">{content.phase} · Afgerond</p>
            <h1 className="text-sm font-semibold text-text">{content.title}</h1>
          </div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            ✓ Afgerond
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-8">
        {/* Sections */}
        {content.sections.map((section) => {
          const example = section.examples
            ? ((primaryComplaint && section.examples[primaryComplaint]) ?? null)
            : null;

          return (
            <section key={section.id}>
              <h2 className="mb-3 text-lg font-bold text-text">{section.title}</h2>
              {'body' in section && section.body && (
                <p className="leading-relaxed text-text-muted">{section.body}</p>
              )}
              {'points' in section && section.points && (
                <ul className="space-y-2 mt-2">
                  {section.points.map((point, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      <span className="text-text-muted">{point}</span>
                    </li>
                  ))}
                </ul>
              )}
              {example && (
                <div className="mt-4 rounded-xl border-l-4 border-primary bg-primary/5 p-4">
                  <p className="text-sm font-medium text-primary mb-1">Herkenbaar voor jou</p>
                  <p className="text-sm text-text-muted">{example}</p>
                </div>
              )}
            </section>
          );
        })}

        {/* Body exercise */}
        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {content.bodyWork}
          </p>
          <h2 className="mb-2 text-lg font-bold text-text">{content.bodyExercise.title}</h2>
          <p className="mb-4 text-text-muted">{content.bodyExercise.description}</p>
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <p className="leading-relaxed text-text-muted whitespace-pre-line">
              {content.bodyExercise.transcript}
            </p>
          </div>
        </section>

        {/* Practical task */}
        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Praktische opdracht
          </p>
          <h2 className="mb-2 text-lg font-bold text-text">{content.practicalTask.title}</h2>
          <p className="leading-relaxed text-text-muted">{content.practicalTask.body}</p>
        </section>

        {/* Back-references */}
        {content.backReferences.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold text-text-muted">Eerdere modules</h3>
            <div className="space-y-2">
              {content.backReferences.map((ref) => (
                <Link
                  key={ref.moduleId}
                  href={`/modules/${ref.moduleId}`}
                  className="block rounded-xl bg-surface p-3 text-sm text-text hover:bg-primary/5 transition-colors shadow-sm"
                >
                  → {ref.label}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
