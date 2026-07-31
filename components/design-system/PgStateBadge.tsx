import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Check,
  CircleDashed,
  Clock,
  Eye,
  Lightbulb,
  PauseCircle,
  PenLine,
  Send,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";

/**
 * One badge for every state the Office shows.
 *
 * State is carried by **glyph + label first**, with colour only reinforcing it.
 * Nothing here is distinguishable by colour alone, so the badges survive
 * greyscale, colour-blindness and low-contrast displays.
 */

export type PgState =
  // work
  | "moving"
  | "queued"
  | "blocked_on_you"
  | "blocked_elsewhere"
  | "completed"
  // content
  | "planned"
  | "draft"
  | "awaiting_review"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  // market
  | "observed"
  | "inferred"
  | "recommended"
  // agreement
  | "autonomous"
  | "needs_approval"
  | "never";

type Tone = "neutral" | "progress" | "decision" | "complete" | "fault" | "restricted";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "text-[var(--pg-color-text-tertiary)]",
  progress: "text-[var(--pg-color-accent)]",
  decision: "text-[var(--pg-color-decision)]",
  complete: "text-[var(--pg-color-success)]",
  fault: "text-[var(--pg-color-error)]",
  restricted: "text-[var(--pg-color-text-tertiary)]",
};

const STATE: Record<PgState, { icon: ReactNode; tone: Tone }> = {
  moving: { icon: <ArrowRight size={12} aria-hidden />, tone: "progress" },
  queued: { icon: <CircleDashed size={12} aria-hidden />, tone: "neutral" },
  blocked_on_you: { icon: <UserCheck size={12} aria-hidden />, tone: "decision" },
  blocked_elsewhere: { icon: <PauseCircle size={12} aria-hidden />, tone: "neutral" },
  completed: { icon: <Check size={12} aria-hidden />, tone: "complete" },

  planned: { icon: <CircleDashed size={12} aria-hidden />, tone: "neutral" },
  draft: { icon: <PenLine size={12} aria-hidden />, tone: "neutral" },
  awaiting_review: { icon: <UserCheck size={12} aria-hidden />, tone: "decision" },
  approved: { icon: <ShieldCheck size={12} aria-hidden />, tone: "progress" },
  scheduled: { icon: <Clock size={12} aria-hidden />, tone: "progress" },
  published: { icon: <Send size={12} aria-hidden />, tone: "complete" },
  failed: { icon: <AlertTriangle size={12} aria-hidden />, tone: "fault" },

  observed: { icon: <Eye size={12} aria-hidden />, tone: "neutral" },
  inferred: { icon: <Lightbulb size={12} aria-hidden />, tone: "decision" },
  recommended: { icon: <ArrowRight size={12} aria-hidden />, tone: "progress" },

  autonomous: { icon: <ShieldCheck size={12} aria-hidden />, tone: "progress" },
  needs_approval: { icon: <UserCheck size={12} aria-hidden />, tone: "decision" },
  never: { icon: <Ban size={12} aria-hidden />, tone: "restricted" },
};

export type PgStateBadgeProps = {
  state: PgState;
  /** Always rendered — the glyph reinforces the word, never replaces it. */
  label: string;
  className?: string;
  testId?: string;
};

export default function PgStateBadge({
  state,
  label,
  className,
  testId,
}: PgStateBadgeProps) {
  const config = STATE[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        "text-[11.5px] font-medium tracking-[0.01em]",
        TONE_CLASS[config.tone],
        className
      )}
      data-state={state}
      data-testid={testId}
    >
      <span className="shrink-0 opacity-80">{config.icon}</span>
      {label}
    </span>
  );
}
