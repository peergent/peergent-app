import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ReportChapter from "@/components/dashboard/ReportChapter";
import DataLabelBadge from "@/components/dashboard/DataLabelBadge";
import type { Opportunity } from "@/lib/command-center/types";

type BiggestOpportunitiesProps = {
  opportunities: Opportunity[];
};

function confidenceLabel(confidence: Opportunity["confidence"]) {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}

export default function BiggestOpportunities({
  opportunities,
}: BiggestOpportunitiesProps) {
  return (
    <ReportChapter
      step={4}
      icon={Target}
      title="Biggest Opportunities"
      action={<DataLabelBadge label="provisional" />}
    >
      <ul className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {opportunities.map((opportunity) => {
          const isPrimary = opportunity.rank === 1;

          return (
            <li key={opportunity.id} className="py-4 first:pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={
                      isPrimary
                        ? "text-[11px] uppercase tracking-[0.08em] text-violet-400/80"
                        : "text-[11px] uppercase tracking-[0.08em] text-slate-600"
                    }
                  >
                    #{opportunity.rank}
                  </p>
                  <h3
                    className={
                      isPrimary
                        ? "mt-1 text-base font-semibold text-white"
                        : "mt-1 text-sm font-medium text-white/90"
                    }
                  >
                    {opportunity.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {opportunity.impactType} · {opportunity.estimate}
                  </p>
                </div>
                <Badge variant="neutral" size="sm" className="shrink-0">
                  {confidenceLabel(opportunity.confidence)}
                </Badge>
              </div>

              {isPrimary && opportunity.signals[0] && (
                <p className="mt-2 text-xs text-slate-500">
                  Signal · {opportunity.signals[0]}
                </p>
              )}

              <div className="mt-3">
                {opportunity.action.href && !opportunity.action.disabled ? (
                  <Link
                    href={opportunity.action.href}
                    className="inline-flex items-center gap-2 text-xs font-medium text-violet-400/80 transition hover:text-violet-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
                  >
                    {opportunity.action.label}
                    <ArrowRight size={14} />
                  </Link>
                ) : (
                  <span className="text-xs text-slate-600">
                    {opportunity.action.label} · Coming soon
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </ReportChapter>
  );
}
