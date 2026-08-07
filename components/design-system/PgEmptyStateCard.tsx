import { cn } from "@/lib/ui/cn";
import PgEmptyState, {
  type PgEmptyStateAction,
  type PgEmptyStateProps,
} from "./PgEmptyState";

export type PgEmptyStateCardProps = Omit<PgEmptyStateProps, "className"> & {
  className?: string;
};

/** P3 — peer-voice invitation when a surface has nothing yet. No border card. */
export default function PgEmptyStateCard({
  className,
  testId = "pg-empty-state-card",
  ...props
}: PgEmptyStateCardProps) {
  return (
    <article
      className={cn(
        "mx-auto flex w-full max-w-[var(--pg-canvas-prose)] flex-col items-center px-[var(--pg-space-4)] py-[var(--pg-space-12)] text-center",
        className
      )}
      data-testid={testId}
    >
      <PgEmptyState
        {...props}
        className="items-center text-center [&_.pg-voice]:text-center"
      />
    </article>
  );
}

export type { PgEmptyStateAction };
