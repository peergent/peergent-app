import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import type { WorkforceSummary } from "@/lib/team/types";
import { cn } from "@/lib/ui/cn";

type WorkforceSummaryProps = {
  summary: WorkforceSummary;
  reducedMotion?: boolean;
};

export default function WorkforceSummaryCard({
  summary,
  reducedMotion,
}: WorkforceSummaryProps) {
  const colleagueLabel = summary.totalCount === 1 ? "colleague" : "colleagues";

  return (
    <section
      aria-labelledby="workforce-summary-heading"
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.06] via-white/[0.02] to-transparent p-6 md:p-7",
        "shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
        !reducedMotion && "pg-section-enter [animation-delay:200ms]"
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/[0.08] blur-3xl"
        aria-hidden
      />

      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/[0.08] bg-white/[0.04]">
          <Users size={20} className="text-violet-400/80" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="workforce-summary-heading"
            className="text-lg font-medium tracking-tight text-white"
          >
            Your AI Workforce
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-400">
            You now have {summary.totalCount} AI {colleagueLabel} working for your
            business.
          </p>
        </div>
      </div>

      {summary.roles.length > 0 && (
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {summary.roles.map((role) => (
            <li
              key={role}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-500"
            >
              {role}
            </li>
          ))}
        </ul>
      )}

      <Link
        href={summary.workforceHref}
        className="pg-hover-lift pg-focus-premium relative mt-6 inline-flex min-h-11 items-center gap-2 rounded-[18px] bg-white px-5 py-2.5 text-sm font-semibold text-violet-950 transition active:scale-[0.98]"
      >
        View all AI Peers
        <ArrowRight size={15} strokeWidth={2} />
      </Link>
    </section>
  );
}
