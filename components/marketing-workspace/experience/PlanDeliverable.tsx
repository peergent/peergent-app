"use client";

import type { ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import ExplainabilitySection from "@/components/marketing-workspace/experience/ExplainabilitySection";
import type { MarketingPlan } from "@/lib/marketing-intelligence";
import { buildPlanExplainability } from "@/lib/marketing-workspace/experience";

type PlanDeliverableProps = {
  plan: MarketingPlan;
};

export default function PlanDeliverable({ plan }: PlanDeliverableProps) {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="neutral" size="sm">
          {plan.confidence} confidence
        </Badge>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{plan.summary}</p>
        <p className="mt-2 text-xs text-slate-600">{plan.confidenceReason}</p>
      </div>

      {plan.objectives.length > 0 && (
        <Section title="Objectives">
          {plan.objectives.map((o) => (
            <Item
              key={o.title}
              title={o.title}
              subtitle={o.description}
              why={o.rationale.why}
            />
          ))}
        </Section>
      )}

      {plan.priorities.length > 0 && (
        <Section title="Priorities">
          {plan.priorities.map((p) => (
            <Item key={p.title} title={`#${p.rank} ${p.title}`} why={p.rationale.why} />
          ))}
        </Section>
      )}

      {plan.campaigns.length > 0 && (
        <Section title="Campaigns">
          {plan.campaigns.map((c) => (
            <Item
              key={c.title}
              title={c.title}
              subtitle={`Weeks ${c.startWeek}–${c.endWeek} · ${c.channels.join(", ")}`}
              why={c.rationale.why}
            />
          ))}
        </Section>
      )}

      {plan.timeline.length > 0 && (
        <Section title="Timeline">
          {plan.timeline.map((phase) => (
            <Item
              key={phase.title}
              title={phase.title}
              subtitle={`Weeks ${phase.startWeek}–${phase.endWeek}`}
              why={phase.rationale.why}
            />
          ))}
        </Section>
      )}

      {plan.expectedOutcomes.length > 0 && (
        <Section title="Expected outcomes">
          {plan.expectedOutcomes.map((o) => (
            <Item key={o.title} title={o.outcome} subtitle={o.timeframe} why={o.rationale.why} />
          ))}
        </Section>
      )}

      <ExplainabilitySection view={buildPlanExplainability(plan)} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-medium uppercase tracking-wider text-slate-600">{title}</h4>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function Item({
  title,
  subtitle,
  why,
}: {
  title: string;
  subtitle?: string;
  why: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
      <p className="text-sm font-medium text-white">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{why}</p>
    </div>
  );
}
