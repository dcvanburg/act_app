/** Inactivity threshold before idle navigation rules apply. */
export const IDLE_MS = 30 * 60 * 1000;

/** Days after login anchor when the session expires at 03:00 Europe/Amsterdam. */
export const SESSION_DAYS = 30;

const AMSTERDAM_TZ = 'Europe/Amsterdam';

export function normalizePathname(pathname: string): string {
  if (pathname.endsWith('/index')) {
    const trimmed = pathname.slice(0, -'/index'.length);
    return trimmed.length > 0 ? trimmed : '/';
  }
  return pathname;
}

/**
 * Expiry instant: 03:00:00 Europe/Amsterdam on the calendar date that is
 * SESSION_DAYS after the anchor's Amsterdam calendar date.
 */
export function computeSessionExpiry(anchorIso: string): Date {
  const anchor = new Date(anchorIso);
  const anchorDate = getAmsterdamDateParts(anchor);
  const expiryCalendar = addCalendarDays(anchorDate, SESSION_DAYS);
  return amsterdamLocalToUtc(
    expiryCalendar.year,
    expiryCalendar.month,
    expiryCalendar.day,
    3,
    0,
    0,
  );
}

export function isSessionExpired(anchorIso: string, now: Date = new Date()): boolean {
  return now.getTime() >= computeSessionExpiry(anchorIso).getTime();
}

export function isIdleExceeded(
  lastActiveIso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!lastActiveIso) return false;
  return now.getTime() - new Date(lastActiveIso).getTime() >= IDLE_MS;
}

export function isOnOnboardingRoute(pathname: string, from?: string | string[]): boolean {
  const route = normalizePathname(pathname);
  const fromParam = Array.isArray(from) ? from[0] : from;

  if (route === '/wizard') return true;
  if (route === '/onboarding') return true;
  if (route === '/mood' && fromParam === 'onboarding') return true;
  if (route === '/modules/onboarding' && fromParam === 'onboarding') return true;

  return false;
}

export function resolveOnboardingStartRoute(profileFirstName: string | null | undefined): string {
  if (!profileFirstName?.trim()) return '/wizard';
  return '/mood?from=onboarding';
}

export function shouldRedirectToHome(pathname: string): boolean {
  const route = normalizePathname(pathname);

  if (route === '/home') return false;
  if (route === '/noodhulp') return false;
  if (route === '/login' || route.startsWith('/auth')) return false;
  if (route === '/') return false;

  return true;
}

export type IdleNavigationAction = 'onboarding_start' | 'home' | 'none';

export function resolveIdleNavigation(input: {
  isOnOnboarding: boolean;
  onboardingModuleCompleted: boolean;
  pathname: string;
}): IdleNavigationAction {
  if (input.isOnOnboarding && !input.onboardingModuleCompleted) {
    return 'onboarding_start';
  }

  if (shouldRedirectToHome(input.pathname)) {
    return 'home';
  }

  return 'none';
}

function getAmsterdamDateParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: AMSTERDAM_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [yearRaw, monthRaw, dayRaw] = formatter.format(date).split('-');
  return {
    year: Number(yearRaw),
    month: Number(monthRaw),
    day: Number(dayRaw),
  };
}

function addCalendarDays(
  date: { year: number; month: number; day: number },
  days: number,
): { year: number; month: number; day: number } {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function amsterdamLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): Date {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: AMSTERDAM_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const target = {
    year: String(year),
    month: String(month).padStart(2, '0'),
    day: String(day).padStart(2, '0'),
    hour: String(hour).padStart(2, '0'),
    minute: String(minute).padStart(2, '0'),
    second: String(second).padStart(2, '0'),
  };

  function matches(instant: Date): boolean {
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map((p) => [p.type, p.value]),
    );
    const hour = parts.hour === '24' ? '00' : parts.hour;
    return (
      parts.year === target.year &&
      parts.month === target.month &&
      parts.day === target.day &&
      hour === target.hour &&
      parts.minute === target.minute &&
      parts.second === target.second
    );
  }

  const naive = Date.UTC(year, month - 1, day, hour - 2, minute, second);
  for (let offsetMs = -4 * 3_600_000; offsetMs <= 4 * 3_600_000; offsetMs += 60_000) {
    const candidate = new Date(naive + offsetMs);
    if (matches(candidate)) return candidate;
  }

  throw new Error(`Could not resolve ${AMSTERDAM_TZ} local time`);
}
