import { cn } from "@/lib/ui/cn";
import {
  PEER_STATUS_TONE,
  type PeerStatus,
  type PeerStatusTone,
} from "@/lib/design-system/foundation";

/**
 * §5 One status vocabulary, product-wide. Every Peer uses these seven words;
 * only the work noun changes. State is encoded in form as well as text so it
 * reads at a glance.
 */

const TONE_STYLES: Record<PeerStatusTone, string> = {
  neutral: "text-[var(--pg-color-text-tertiary)]",
  decision: "text-[var(--pg-color-decision)]",
  progress: "text-[var(--pg-color-accent)]",
  complete: "text-[var(--pg-color-success)]",
  fault: "text-[var(--pg-color-error)]",
};

export type PgStatusPillProps = {
  status: PeerStatus;
  label: string;
  className?: string;
  testId?: string;
};

export default function PgStatusPill({
  status,
  label,
  className,
  testId,
}: PgStatusPillProps) {
  const tone = PEER_STATUS_TONE[status];

  return (
    <span
      className={cn("pg-label inline-flex items-center gap-1.5", TONE_STYLES[tone], className)}
      data-status={status}
      data-testid={testId}
    >
      {tone !== "neutral" ? (
        <span className="pg-presence-dot" aria-hidden style={{ width: 5, height: 5 }} />
      ) : null}
      {label}
    </span>
  );
}
