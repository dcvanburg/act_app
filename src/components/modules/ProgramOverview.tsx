import Link from 'next/link';
import { getModuleStatus, MODULE_ORDER } from '@/lib/progress';
import { MODULE_META } from '@/lib/content';
import type { ModuleId, UserProgress } from '@/types/content';
import common from '@/content/nl/common.json';

interface Props {
  progress: UserProgress;
}

export function ProgramOverview({ progress }: Props) {
  return (
    <nav aria-label="Programma overzicht">
      <ol className="space-y-2">
        {MODULE_ORDER.map((moduleId, index) => {
          const status = getModuleStatus(moduleId, progress);
          const meta = MODULE_META[moduleId];
          const locked = status === 'locked';
          const href = moduleId === 'onboarding' ? '/onboarding' : `/modules/${moduleId}`;

          return (
            <li key={moduleId}>
              {locked ? (
                <div
                  aria-label={common.progress.moduleLocked}
                  className="flex items-center gap-4 rounded-xl bg-surface/60 p-4 opacity-60"
                >
                  <ModuleIndicator index={index} status={status} />
                  <ModuleInfo meta={meta} status={status} />
                  <LockIcon />
                </div>
              ) : (
                <Link
                  href={href}
                  className="flex items-center gap-4 rounded-xl bg-surface p-4 shadow-sm hover:shadow-md hover:bg-primary/5 transition-all"
                >
                  <ModuleIndicator index={index} status={status} />
                  <ModuleInfo meta={meta} status={status} />
                  <ChevronIcon />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ModuleIndicator({ index, status }: { index: number; status: ReturnType<typeof getModuleStatus> }) {
  const base = 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold';
  const styles = {
    completed:   `${base} bg-primary text-white`,
    in_progress: `${base} bg-primary/20 text-primary`,
    available:   `${base} border-2 border-primary text-primary`,
    locked:      `${base} border-2 border-border text-text-muted`,
  };
  return (
    <span className={styles[status]}>
      {status === 'completed' ? '✓' : index}
    </span>
  );
}

function ModuleInfo({ meta, status }: { meta: { title: string; phase: string }; status: ReturnType<typeof getModuleStatus> }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{meta.phase}</p>
      <p className="font-semibold text-text truncate">{meta.title}</p>
      {status === 'in_progress' && (
        <p className="text-xs text-primary mt-0.5">{/* common.progress.moduleInProgress */}Bezig</p>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-text-muted" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-text-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
