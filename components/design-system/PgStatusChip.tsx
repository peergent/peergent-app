import { cn } from "@/lib/ui/cn";

export type PgStatusChipTone =
  | "neutral"
  | "working"
  | "waiting"
  | "live"
  | "idle"
  | "attention";

const TONE_DOT: Record<PgStatusChipTone, string> = {
  neutral: "var(--pg-text-faint)",
  working: "var(--pg-action-primary)",
  waiting: "var(--pg-state-attention)",
  live: "var(--pg-state-positive)",
  idle: "var(--pg-text-faint)",
  attention: "var(--pg-state-attention)",
};

export type PgStatusChipProps = {
  label: string;
  tone?: PgStatusChipTone;
  pulse?: boolean;
  className?: string;
  testId?: string;
};

/** Human-readable status — never color alone. */
export default function PgStatusChip({
  label,
  tone = "neutral",
  pulse = false,
  className,
  testId,
}: PgStatusChipProps) {
  const shouldPulse = pulse || tone === "working";

  return (
    <span
      className={cn(
        "pg-ds-chip inline-flex items-center rounded-full border border-[var(--pg-border-soft)]",
        "bg-[var(--pg-office-inset,var(--pg-v13-panel))] px-2.5 py-1",
        className
      )}
      data-testid={testId}
      data-tone={tone}
    >
      <span
        className={cn("pg-ds-chip-dot", shouldPulse && "pg-ds-chip-dot--pulse")}
        style={{ ["--pg-chip-dot" as string]: TONE_DOT[tone] }}
        aria-hidden
      />
      {label}
    </span>
  );
}
