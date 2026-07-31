import { cn } from "@/lib/ui/cn";

/**
 * The Peer's identity mark.
 *
 * Two concentric arcs around a solid core: the core is the Peer, the open outer
 * arc is the work she is holding, and the gap is where the customer sits. It
 * reads as *intelligence beside you* rather than a face, a bot or a sparkle —
 * and it stays legible at 20px in a rail.
 *
 * The outer arc rotates only while she is genuinely working, and stops
 * completely under reduced-motion. Presence is information, so the mark never
 * disappears — it only stops moving.
 */

export type PgPeerMarkProps = {
  /** Peer accent, as a CSS colour or var() reference. */
  accent: string;
  size?: number;
  working?: boolean;
  className?: string;
};

export default function PgPeerMark({
  accent,
  size = 36,
  working = false,
  className,
}: PgPeerMarkProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" width={size} height={size} className="block">
        <defs>
          <radialGradient id="pg-peer-core" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={accent} stopOpacity="1" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* Static outer ring — the boundary of her remit. */}
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke={accent}
          strokeOpacity="0.22"
          strokeWidth="1.25"
        />

        {/* The open arc. Rotates only while working. */}
        <g className={working ? "pg-peer-mark-orbit" : undefined}>
          <path
            d="M20 2 a18 18 0 0 1 15.6 9"
            fill="none"
            stroke={accent}
            strokeOpacity="0.85"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </g>

        {/* Core. */}
        <circle cx="20" cy="20" r="9" fill="url(#pg-peer-core)" />
        <circle
          cx="20"
          cy="20"
          r="9"
          fill="none"
          stroke={accent}
          strokeOpacity="0.5"
          strokeWidth="0.75"
        />
      </svg>
    </span>
  );
}
