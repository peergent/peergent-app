import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type ReportChapterProps = {
  step: number;
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function ReportChapter({
  step,
  icon: Icon,
  title,
  action,
  className,
  children,
}: ReportChapterProps) {
  return (
    <section className={cn(className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--pg-radius-md)] border border-white/[0.08] bg-white/[0.03] text-slate-400">
            <Icon size={18} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[11px] font-medium tabular-nums uppercase tracking-[0.08em] text-slate-600">
              {String(step).padStart(2, "0")}
            </p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-white">
              {title}
            </h2>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
