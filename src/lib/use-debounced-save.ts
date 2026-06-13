import { useEffect, useRef } from 'react';

type Options = {
  delayMs?: number;
  enabled?: boolean;
  /** External persisted value — skips save when `value` matches and resets after remote sync. */
  baseline?: string;
};

/**
 * Persists `value` via `onSave` after typing pauses, and flushes pending edits on unmount.
 */
export function useDebouncedSave(
  value: string,
  onSave: (value: string) => void,
  options?: Options,
): void {
  const delayMs = options?.delayMs ?? 600;
  const enabled = options?.enabled ?? true;
  const baseline = options?.baseline;
  const onSaveRef = useRef(onSave);
  const lastSavedRef = useRef(baseline ?? value);

  onSaveRef.current = onSave;

  useEffect(() => {
    if (baseline !== undefined) {
      lastSavedRef.current = baseline;
    }
  }, [baseline]);

  useEffect(() => {
    if (!enabled || value === lastSavedRef.current) return;

    const timer = setTimeout(() => {
      onSaveRef.current(value);
      lastSavedRef.current = value;
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs, enabled]);

  useEffect(() => {
    return () => {
      if (!enabled || value === lastSavedRef.current) return;
      onSaveRef.current(value);
    };
  }, [enabled, value]);
}
