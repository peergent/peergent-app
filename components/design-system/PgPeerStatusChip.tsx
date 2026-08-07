import { cn } from "@/lib/ui/cn";

export type PgPeerStatusChipTone = "working" | "waiting" | "live" | "idle";

const TONE_DOT: Record<PgPeerStatusChipTone, string> = {
  working: "var(--pg-action-primary)",
  waiting: "var(--pg-state-attention)",
  live: "var(--pg-state-positive)",
  idle: "var(--pg-text-faint)",
};

export type PgPeerStatusChipProps = {
  name: string;
  role: string;
  statusLine: string;
  tone?: PgPeerStatusChipTone;
  accentVar?: string;
  className?: string;
  testId?: string;
};

/** P4 — inline peer presence for team pulse strips. */
export default function PgPeerStatusChip({
  name,
  role,
  statusLine,
  tone = "working",
  accentVar = "var(--pg-peer-marketing)",
  className,
  testId = "pg-peer-status-chip",
}: PgPeerStatusChipProps) {
  const shouldPulse = tone === "working";

  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-[var(--pg-radius-md)]",
        "border border-[var(--pg-border-soft)] bg-[var(--pg-office-panel,var(--pg-v13-surface))]",
        "px-2.5 py-1.5",
        className
      )}
      data-testid={testId}
      data-tone={tone}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ background: accentVar }}
        aria-hidden
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-[13px] font-medium text-[var(--pg-text)]">
          {name} · {role}
        </span>
        <span className="flex items-center gap-1.5 truncate text-[11px] text-[var(--pg-text-soft)]">
          <span
            className={cn("pg-ds-chip-dot", shouldPulse && "pg-ds-chip-dot--pulse")}
            style={{ ["--pg-chip-dot" as string]: TONE_DOT[tone] }}
            aria-hidden
          />
          {statusLine}
        </span>
      </span>
    </span>
  );
}
