import Link from 'next/link';
import common from '@/content/nl/common.json';

// Fixed position — visible on every screen. Safety non-negotiable.
// Min 44px touch target per frontend rules.
export function NoodknopButton() {
  return (
    <Link
      href="/noodhulp"
      aria-label={common.emergency.buttonLabel}
      className="fixed bottom-6 right-4 z-50 flex min-h-[44px] items-center gap-2 rounded-full bg-crisis px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-crisis/90 focus:outline-none focus:ring-2 focus:ring-crisis focus:ring-offset-2 transition-colors"
    >
      {/* Heart icon — inline SVG avoids external dependency */}
      <svg
        aria-hidden="true"
        className="h-4 w-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {common.emergency.buttonLabel}
    </Link>
  );
}
