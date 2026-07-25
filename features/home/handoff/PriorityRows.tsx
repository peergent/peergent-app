import { BarChart3, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import type { HandoffSecondaryPriority } from "@/lib/home/handoff-types";
import { cn } from "@/lib/ui/cn";

type PriorityRowsProps = {
  items: HandoffSecondaryPriority[];
  className?: string;
};

export default function PriorityRows({ items, className }: PriorityRowsProps) {
  if (items.length === 0) return null;

  return (
    <section className={cn("mt-8", className)} aria-label="Other priorities">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pg-color-text-tertiary)]">
          Other priorities
        </h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/[0.06] px-1.5 text-[11px] font-medium text-[var(--pg-color-text-secondary)]">
          {items.length}
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon === "chart" ? BarChart3 : FileText;
          const inner = (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.04] text-[var(--pg-color-text-tertiary)]">
                <Icon size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-[var(--pg-color-text-primary)]">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-sm text-[var(--pg-color-text-tertiary)]">
                  {item.subtitle}
                </span>
              </span>
              <ChevronRight
                size={16}
                className="shrink-0 text-[var(--pg-color-text-disabled)]"
                aria-hidden
              />
            </>
          );

          return (
            <li key={item.id}>
              {item.destination ? (
                <Link
                  href={item.destination}
                  className="home-priority-row pg-focus-premium flex min-h-[64px] items-center gap-4 rounded-[14px] px-4 py-3"
                >
                  {inner}
                </Link>
              ) : (
                <div className="home-priority-row flex min-h-[64px] items-center gap-4 rounded-[14px] px-4 py-3">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
