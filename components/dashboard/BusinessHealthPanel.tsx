"use client";

import { useState } from "react";
import { ScanSearch } from "lucide-react";
import Progress from "@/components/ui/Progress";
import SystemState from "@/components/ui/SystemState";
import ReportChapter from "@/components/dashboard/ReportChapter";
import DataLabelBadge, {
  getDomainStateLabel,
  getOverallHealthLabel,
} from "@/components/dashboard/DataLabelBadge";
import { getHealthSystemState } from "@/lib/command-center/presence";
import type {
  BusinessDomain,
  DataCompletenessBreakdown,
  QualitativeHealthState,
} from "@/lib/command-center/types";

type BusinessHealthPanelProps = {
  overallState: QualitativeHealthState;
  domains: BusinessDomain[];
  completeness: DataCompletenessBreakdown;
};

const INITIAL_DOMAIN_COUNT = 4;

export default function BusinessHealthPanel({
  overallState,
  domains,
  completeness,
}: BusinessHealthPanelProps) {
  const [showAllDomains, setShowAllDomains] = useState(false);
  const healthState = getHealthSystemState(overallState);
  const visibleDomains = showAllDomains
    ? domains
    : domains.slice(0, INITIAL_DOMAIN_COUNT);
  const hiddenCount = domains.length - INITIAL_DOMAIN_COUNT;

  return (
    <ReportChapter step={2} icon={ScanSearch} title="What I'm seeing">
      <SystemState
        mode={healthState.mode}
        label={healthState.label}
        className="mb-6"
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {getOverallHealthLabel(overallState)}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Qualitative read — precise scoring withheld.
          </p>
        </div>
        <DataLabelBadge label="provisional" />
      </div>

      <div className="mt-6 max-w-md">
        <Progress value={completeness.totalPercent} showValue size="sm" />
      </div>

      <ul className="mt-8 divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {visibleDomains.map((domain) => (
          <li
            key={domain.id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-5"
          >
            <span className="text-sm font-medium text-white/90">{domain.name}</span>
            <span className="text-xs text-slate-600">
              {getDomainStateLabel(domain.state)} · {domain.note}
            </span>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && !showAllDomains && (
        <button
          type="button"
          onClick={() => setShowAllDomains(true)}
          className="mt-2 text-xs text-slate-500 transition hover:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
        >
          View all domains ({hiddenCount} more)
        </button>
      )}
    </ReportChapter>
  );
}
