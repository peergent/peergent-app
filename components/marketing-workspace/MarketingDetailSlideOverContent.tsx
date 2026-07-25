"use client";

import Progress from "@/components/ui/Progress";
import PlanDeliverable from "@/components/marketing-workspace/experience/PlanDeliverable";
import StrategyDeliverable from "@/components/marketing-workspace/experience/StrategyDeliverable";
import type { ExplainabilityPresentationViewModel } from "@/lib/peer-experience/marketing/details-explainability";
import type {
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { DetailSlideOverKind } from "@/lib/peer-experience";

type MarketingDetailSlideOverContentProps = {
  kind: DetailSlideOverKind;
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  profileCounts: { goals: number; content: number };
  explainability: ExplainabilityPresentationViewModel | null;
};

export default function MarketingDetailSlideOverContent({
  kind,
  understanding,
  strategy,
  plan,
  profileCounts,
  explainability,
}: MarketingDetailSlideOverContentProps) {
  if (kind === "business-context") {
    if (!understanding?.available) {
      return <p className="text-sm text-[var(--pg-color-text-secondary)]">No business context available yet.</p>;
    }

    return (
      <div className="space-y-5">
        <Progress value={understanding.completeness} label="Knowledge completeness" />
        {understanding.brand.positioningStatement && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">Positioning</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">
              {understanding.brand.positioningStatement}
            </p>
          </div>
        )}
        {understanding.brand.toneOfVoice.summary && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">Tone of voice</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">
              {understanding.brand.toneOfVoice.summary}
            </p>
          </div>
        )}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="Products" value={understanding.products.length} />
          <Metric label="Segments" value={understanding.customerSegments.length} />
          <Metric label="Goals" value={profileCounts.goals} />
          <Metric label="Content sources" value={profileCounts.content} />
        </dl>
      </div>
    );
  }

  if (kind === "strategy") {
    if (!strategy) {
      return <p className="text-sm text-[var(--pg-color-text-secondary)]">Strategy not created yet.</p>;
    }
    return <StrategyDeliverable strategy={strategy} />;
  }

  if (kind === "plan") {
    if (!plan) {
      return <p className="text-sm text-[var(--pg-color-text-secondary)]">Campaign plan not created yet.</p>;
    }
    return <PlanDeliverable plan={plan} />;
  }

  if (!explainability) {
    return (
      <p className="text-sm text-[var(--pg-color-text-secondary)]">
        Reasoning will appear here when there is work to inspect.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">{explainability.summary}</p>
        {explainability.confidenceLabel && (
          <p className="mt-2 text-xs text-[var(--pg-color-text-tertiary)]">{explainability.confidenceLabel}</p>
        )}
      </div>

      {explainability.reasons.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">What shaped this</p>
          <ul className="mt-2 space-y-2">
            {explainability.reasons.map((reason) => (
              <li key={reason} className="text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {explainability.supportingPoints.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">Based on</p>
          <ul className="mt-2 space-y-1">
            {explainability.supportingPoints.map((point) => (
              <li key={point} className="text-sm text-[var(--pg-color-text-tertiary)]">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[12px] border border-[var(--pg-color-border)] bg-[var(--pg-color-surface-raised)] px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-[var(--pg-color-text-primary)]">{value}</dd>
    </div>
  );
}
