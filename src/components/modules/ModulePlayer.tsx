'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveModuleProgress } from '@/app/actions/progress';
import { FINAL_SCREEN_ID } from '@/lib/progress';
import { cn } from '@/lib/utils';
import type { ModuleContent, ComplaintType, ContentSection } from '@/types/content';
import common from '@/content/nl/common.json';

// ── Screen type ───────────────────────────────────────────────────────────────

type Screen =
  | { id: string; type: 'section'; data: ContentSection }
  | { id: 'body-exercise'; type: 'exercise' }
  | { id: typeof FINAL_SCREEN_ID; type: 'task' };

function buildScreens(content: ModuleContent): Screen[] {
  return [
    ...content.sections.map((s) => ({ id: s.id, type: 'section' as const, data: s })),
    { id: 'body-exercise' as const, type: 'exercise' as const },
    { id: FINAL_SCREEN_ID, type: 'task' as const },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  content: ModuleContent;
  initialScreenId: string | null;
  complaintTypes: ComplaintType[];
}

export function ModulePlayer({ content, initialScreenId, complaintTypes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const screens = buildScreens(content);
  const initialIndex = initialScreenId
    ? Math.max(
        0,
        screens.findIndex((s) => s.id === initialScreenId),
      )
    : 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentScreen = screens[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === screens.length - 1;

  // Save progress whenever the screen changes
  useEffect(() => {
    if (!currentScreen) return;
    const completed = isLast;
    saveModuleProgress(content.id, currentScreen.id, completed).catch(() => {
      // Progress save is best-effort — don't block the user
    });
  }, [currentIndex, content.id, currentScreen, isLast]);

  function goNext() {
    if (isLast) {
      // Final screen reached → completion saved in effect above → navigate home
      startTransition(() => {
        router.push('/home');
        router.refresh();
      });
      return;
    }
    setCurrentIndex((i) => i + 1);
  }

  function goBack() {
    if (!isFirst) setCurrentIndex((i) => i - 1);
  }

  if (!currentScreen) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={() => router.push('/home')}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium text-text-muted">{content.phase}</p>
            <h1 className="text-sm font-semibold text-text leading-tight">{content.title}</h1>
          </div>
          <span className="text-xs text-text-muted">
            {currentIndex + 1} / {screens.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mx-auto mt-2 max-w-lg">
          <div className="h-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / screens.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Screen content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="mx-auto max-w-lg">
          <ScreenContent screen={currentScreen} content={content} complaintTypes={complaintTypes} />
        </div>
      </main>

      {/* Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface/90 backdrop-blur-sm px-4 py-4">
        <div className="mx-auto flex max-w-lg gap-3">
          {!isFirst && (
            <button
              onClick={goBack}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-text hover:bg-background transition-colors"
            >
              {common.actions.back}
            </button>
          )}
          <button
            onClick={goNext}
            disabled={isPending}
            className={cn(
              'flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white',
              'hover:bg-primary-dark transition-colors',
              'disabled:opacity-60',
              isFirst && 'w-full',
            )}
          >
            {isLast ? common.actions.complete : common.actions.continue}
          </button>
        </div>
      </footer>
    </div>
  );
}

// ── Screen content renderer ───────────────────────────────────────────────────

function ScreenContent({
  screen,
  content,
  complaintTypes,
}: {
  screen: Screen;
  content: ModuleContent;
  complaintTypes: ComplaintType[];
}) {
  if (screen.type === 'section') {
    const { data: section } = screen;
    const example = section.examples
      ? ((complaintTypes[0] && section.examples[complaintTypes[0]]) ?? null)
      : null;

    return (
      <div>
        <h2 className="mb-4 text-xl font-bold text-text">{section.title}</h2>
        {'body' in section && section.body && (
          <p className="mb-4 leading-relaxed text-text-muted">{section.body}</p>
        )}
        {'points' in section && section.points && (
          <ul className="space-y-2">
            {section.points.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <span className="text-text-muted">{point}</span>
              </li>
            ))}
          </ul>
        )}
        {example && (
          <div className="mt-6 rounded-xl border-l-4 border-primary bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary mb-1">Herkenbaar voor jou</p>
            <p className="text-sm text-text-muted">{example}</p>
          </div>
        )}
      </div>
    );
  }

  if (screen.type === 'exercise') {
    const ex = content.bodyExercise;
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
          {content.bodyWork}
        </p>
        <h2 className="mb-3 text-xl font-bold text-text">{ex.title}</h2>
        <p className="mb-6 text-text-muted">{ex.description}</p>
        <div className="rounded-xl bg-surface p-5 shadow-sm">
          <p className="leading-relaxed text-text-muted whitespace-pre-line">{ex.transcript}</p>
        </div>
      </div>
    );
  }

  // task — final screen
  const task = content.practicalTask;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
        Praktische opdracht
      </p>
      <h2 className="mb-3 text-xl font-bold text-text">{task.title}</h2>
      <p className="leading-relaxed text-text-muted">{task.body}</p>
    </div>
  );
}
