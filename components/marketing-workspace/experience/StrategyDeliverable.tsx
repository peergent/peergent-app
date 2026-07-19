"use client";

import type { ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import ExplainabilitySection from "@/components/marketing-workspace/experience/ExplainabilitySection";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import { buildStrategyExplainability } from "@/lib/marketing-workspace/experience";

type StrategyDeliverableProps = {
  strategy: MarketingStrategy;
};

export default function StrategyDeliverable({ strategy }: StrategyDeliverableProps) {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="neutral" size="sm">
          {strategy.confidence} confidence
        </Badge>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{strategy.summary}</p>
        <p className="mt-2 text-xs text-slate-600">{strategy.confidenceReason}</p>
      </div>

      {strategy.targetAudiences.length > 0 && (
        <Section title="Target audiences">
          {strategy.targetAudiences.map((a) => (
            <Item key={a.segment} title={a.segment} subtitle={a.priority} why={a.rationale.why} />
          ))}
        </Section>
      )}

      {strategy.positioningRecommendations.length > 0 && (
        <Section title="Positioning">
          {strategy.positioningRecommendations.map((p) => (
            <Item key={p.recommendation} title={p.recommendation} why={p.rationale.why} />
          ))}
        </Section>
      )}

      {strategy.contentPillars.length > 0 && (
        <Section title="Content pillars">
          {strategy.contentPillars.map((p) => (
            <Item
              key={p.name}
              title={p.name}
              subtitle={p.themes.join(", ")}
              why={p.rationale.why}
            />
          ))}
        </Section>
      )}

      {strategy.campaignIdeas.length > 0 && (
        <Section title="Campaign ideas">
          {strategy.campaignIdeas.map((c) => (
            <Item
              key={c.name}
              title={c.name}
              subtitle={`${c.objective} · ${c.channels.join(", ")}`}
              why={c.rationale.why}
            />
          ))}
        </Section>
      )}

      {strategy.marketingPriorities.length > 0 && (
        <Section title="Priorities">
          {strategy.marketingPriorities.map((p) => (
            <Item key={p.title} title={`#${p.priority} ${p.title}`} why={p.rationale.why} />
          ))}
        </Section>
      )}

      <ExplainabilitySection view={buildStrategyExplainability(strategy)} defaultOpen />
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
      {subtitle && <p className="mt-0.5 text-xs capitalize text-slate-500">{subtitle}</p>}
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{why}</p>
    </div>
  );
}
