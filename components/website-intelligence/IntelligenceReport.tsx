import Link from "next/link";
import RecommendedEmployeeCard from "@/components/website-intelligence/RecommendedEmployeeCard";
import {
  ArrowRight,
  CalendarDays,
  Headphones,
  Megaphone,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type {
  RecommendedEmployee,
  WebsiteInsight,
  WebsiteIntelligenceReport,
} from "@/lib/website-intelligence";

type IntelligenceReportProps = {
  report: WebsiteIntelligenceReport;
  onAnalyzeAnother: () => void;
  onOpenCreatePeer: (employee: RecommendedEmployee) => void;
};

const insightIcons = {
  traffic: TrendingUp,
  support: Headphones,
  content: Megaphone,
  sales: CalendarDays,
};

function InsightCard({ insight }: { insight: WebsiteInsight }) {
  const Icon = insightIcons[insight.icon];

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
        <Icon size={18} className="text-violet-400" />
      </div>
      <h3 className="mt-4 font-semibold">{insight.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {insight.description}
      </p>
    </article>
  );
}

export default function IntelligenceReport({
  report,
  onAnalyzeAnother,
  onOpenCreatePeer,
}: IntelligenceReportProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1120]/95 via-[#10182f]/95 to-violet-950/25 p-6 shadow-2xl shadow-black/20 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <Sparkles size={14} />
              Analysis complete
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {report.companyName} Intelligence Report
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
              {report.summary}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <p className="text-slate-500">Website</p>
            <p className="mt-1 font-medium text-white">{report.url}</p>
            <p className="mt-4 text-slate-500">Industry</p>
            <p className="mt-1 font-medium text-violet-300">{report.industry}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1120]/90 p-6 md:p-8">
        <h3 className="text-xl font-semibold">Key insights</h3>
        <p className="mt-1 text-sm text-slate-400">
          What Peergent detected from the website and business signals.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {report.insights.map((insight) => (
            <InsightCard key={insight.title} insight={insight} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1120]/90 p-6 md:p-8">
        <h3 className="text-xl font-semibold">Automation opportunities</h3>
        <p className="mt-1 text-sm text-slate-400">
          Areas where AI employees can deliver the highest return.
        </p>

        <div className="mt-6 space-y-4">
          {report.opportunities.map((opportunity) => (
            <article
              key={opportunity.area}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-medium">{opportunity.area}</h4>
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                  Score {opportunity.score}/100
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                  style={{ width: `${opportunity.score}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                {opportunity.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#0b1120]/95 to-violet-950/20 p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-400">
              Recommended AI Employees
            </p>
            <h3 className="mt-1 text-2xl font-semibold">
              Your suggested AI workforce
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Digital colleagues matched to {report.companyName}&apos;s website,
              customer journey, and growth opportunities.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          {report.recommendations.map((employee) => (
            <RecommendedEmployeeCard
              key={employee.name}
              employee={employee}
              onCreatePeer={() => onOpenCreatePeer(employee)}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAnalyzeAnother}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/10"
        >
          Analyze another website
        </button>
        <Link
          href="/peers"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
        >
          Build your AI workforce
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
