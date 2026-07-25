import type { ReactNode } from "react";
import { STUDIO_COPY } from "@/lib/i18n/studio-copy";
import { cn } from "@/lib/ui/cn";

export type PgWorkPlaneProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Primary workspace surface — fills the chamber, typography-first, not a dashboard card.
 */
export default function PgWorkPlane({ children, className }: PgWorkPlaneProps) {
  return (
    <section
      aria-label={STUDIO_COPY.workPlane.ariaLabel}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col",
        "bg-gradient-to-b from-transparent via-white/[0.015] to-white/[0.03]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--pg-color-border-subtle)] to-transparent" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-6 py-10 md:px-12 md:py-16 lg:py-20">
        {children}
      </div>
    </section>
  );
}
