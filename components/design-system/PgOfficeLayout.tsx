import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * Shared Office layout primitives.
 *
 * Every destination composes from these so the six pages read as one product.
 * Page files should not hand-roll headings, section rhythm or caveat styling —
 * that is what caused the drift these replace.
 */

/* ---------------- Page ----------------------------------------------------- */

export type PgPageProps = {
  children: ReactNode;
  className?: string;
  testId?: string;
};

/** Bounded column with consistent vertical rhythm between sections. */
export function PgPage({ children, className, testId }: PgPageProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col",
        "max-w-[var(--pg-office-content-max)]",
        "gap-[var(--pg-office-section-gap)]",
        className
      )}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

/* ---------------- Page header ---------------------------------------------- */

export type PgPageHeaderProps = {
  title: string;
  /** One line stating the page's purpose. */
  subtitle?: string | null;
  /** At most one primary action, right-aligned. */
  action?: ReactNode;
  /** Quiet supporting line beneath, e.g. freshness. */
  meta?: ReactNode;
};

export function PgPageHeader({
  title,
  subtitle,
  action,
  meta,
}: PgPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start gap-x-[var(--pg-space-4)] gap-y-[var(--pg-space-3)]">
      <div className="min-w-0 flex-1">
        <h1 className="pg-display pg-display--sm">{title}</h1>
        {subtitle ? (
          <p className="pg-body pg-measure mt-[var(--pg-space-2)]">{subtitle}</p>
        ) : null}
        {meta ? <div className="mt-[var(--pg-space-2)]">{meta}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/* ---------------- Section --------------------------------------------------- */

export type PgSectionProps = {
  title: string;
  /** Count shown beside the title when a group has a size worth knowing. */
  count?: number | null;
  /** Marks a section that needs the customer. Amber, used sparingly. */
  attention?: boolean;
  /** Low-emphasis control, e.g. expand/collapse. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
};

export function PgSection({
  title,
  count,
  attention = false,
  action,
  children,
  className,
  testId,
}: PgSectionProps) {
  const headingId = `pg-section-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section
      className={cn("flex flex-col gap-[var(--pg-space-4)]", className)}
      aria-labelledby={headingId}
      data-testid={testId}
    >
      <div className="flex items-baseline gap-[var(--pg-space-3)]">
        <h2
          id={headingId}
          className={cn(
            "text-[10.5px] font-medium tracking-[0.09em] uppercase",
            attention
              ? "text-[var(--pg-color-decision)]"
              : "text-[var(--pg-color-text-secondary)]"
          )}
        >
          {title}
        </h2>
        {typeof count === "number" ? (
          <span className="text-[11.5px] tabular-nums text-[var(--pg-color-text-tertiary)]">
            {count}
          </span>
        ) : null}
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      <div className="flex flex-col gap-[var(--pg-office-card-gap)]">{children}</div>
    </section>
  );
}

/* ---------------- Methodology / caveat -------------------------------------- */

export type PgMethodologyProps = {
  children: ReactNode;
  className?: string;
  testId?: string;
};

/**
 * Supporting context that must be present but must not compete: methodology,
 * caveats, data limitations. Deliberately the lowest-emphasis text on a page.
 */
export function PgMethodology({
  children,
  className,
  testId,
}: PgMethodologyProps) {
  return (
    <p
      data-testid={testId}
      className={cn(
        "pg-measure text-[12.5px] leading-relaxed text-[var(--pg-color-text-tertiary)]",
        className
      )}
    >
      {children}
    </p>
  );
}

/* ---------------- Metadata row ---------------------------------------------- */

export type PgMetaProps = {
  /** Nulls are dropped, so callers do not need to filter. */
  items: (string | null | undefined)[];
  className?: string;
};

/** A quiet, dot-separated row of secondary facts. */
export function PgMeta({ items, className }: PgMetaProps) {
  const visible = items.filter((item): item is string => Boolean(item && item.trim()));
  if (visible.length === 0) return null;

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-[var(--pg-space-2)] gap-y-1",
        "text-[11.5px] text-[var(--pg-color-text-tertiary)]",
        className
      )}
    >
      {visible.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center gap-[var(--pg-space-2)]">
          {index > 0 ? <span aria-hidden>·</span> : null}
          {item}
        </span>
      ))}
    </p>
  );
}
