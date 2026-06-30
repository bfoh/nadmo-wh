import { cn } from '@/lib/utils';

/**
 * NADMO emblem — a Ghana national roundel:
 * green field, red ring, gold disc, and the Black Star of Ghana.
 * Renders inline SVG so it stays crisp at any size and inherits layout via className.
 */
export function NadmoLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="NADMO"
      className={cn('h-8 w-8', className)}
    >
      <circle cx="32" cy="32" r="32" fill="#006B3F" />
      <circle cx="32" cy="32" r="29" fill="none" stroke="#CE1126" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="22" fill="#FCD116" />
      <path
        d="M32 16 L35.76 26.82 L47.22 27.06 L38.09 33.98 L41.40 44.94 L32 38.4 L22.60 44.94 L25.91 33.98 L16.78 27.06 L28.24 26.82 Z"
        fill="#111111"
      />
    </svg>
  );
}
