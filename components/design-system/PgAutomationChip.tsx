import { cn } from "@/lib/ui/cn";

export type PgAutomationChipProps = {
  label?: string;
  live?: boolean;
  className?: string;
  testId?: string;
};

/** P4 — ambient autonomous mode indicator. Never a full card. */
export default function PgAutomationChip({
  label = "Autonomous · Live",
  live = true,
  className,
  testId = "pg-automation-chip",
}: PgAutomationChipProps) {
  return (
    <span
      className={cn(
        "pg-ds-chip inline-flex items-center rounded-full border border-[var(--pg-border-soft)]",
        "bg-[var(--pg-office-inset,var(--pg-v13-panel))] px-2.5 py-1",
        className
      )}
      data-testid={testId}
    >
      <span
        className={cn("pg-ds-chip-dot", live && "pg-ds-chip-dot--pulse")}
        style={{ ["--pg-chip-dot" as string]: "var(--pg-state-positive)" }}
        aria-hidden
      />
      {label}
    </span>
  );
}
