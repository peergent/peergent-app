"use client";

import PgInspector, { type PgInspectorProps } from "@/components/design-system/PgInspector";
import { cn } from "@/lib/ui/cn";

export type PgAlcoveProps = PgInspectorProps;

/**
 * Alcove — read-only supporting context beside the work plane (360px).
 * Opens during review; never replaces the table.
 */
export default function PgAlcove({ className, ...props }: PgAlcoveProps) {
  return (
    <PgInspector
      {...props}
      focusTrap={false}
      aria-labelledby="pg-inspector-title"
      className={cn(
        "lg:h-auto lg:min-h-0 lg:self-stretch lg:border-l lg:border-[var(--pg-color-border-subtle)]",
        className
      )}
    />
  );
}
