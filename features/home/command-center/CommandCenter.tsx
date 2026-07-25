"use client";

import { useMemo } from "react";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import { activitySourcesFromMarketingSnapshots } from "@/lib/home";
import { buildCommandCenterViewModel } from "@/lib/home/build-command-center-view-model";
import { formatHomeRelativeTime } from "@/lib/i18n";
import { CommandCenterHeader, CommandCenterIntro } from "./CommandCenterHeader";
import { CommandCenterKpiGrid } from "./CommandCenterKpiGrid";
import { NeedsAttentionPanel } from "./NeedsAttentionPanel";
import { LiveActivityPanel } from "./LiveActivityPanel";
import { AgentPerformanceGrid } from "./AgentPerformanceGrid";
import { RevenueAttributionPanel } from "./RevenueAttributionPanel";
import "./command-center.css";

/** Approved desktop section order (for tests and layout documentation). */
export const COMMAND_CENTER_LAYOUT_SECTIONS = [
  "header",
  "intro",
  "kpis",
  "attention-activity",
  "agent-performance",
  "revenue-attribution",
] as const;

export type CommandCenterProps = {
  homeState: HandoffHomeState;
};

export default function CommandCenter({ homeState }: CommandCenterProps) {
  const { handoff, viewModel, copy, marketingSnapshots } = homeState;

  const model = useMemo(() => {
    if (!handoff) return null;

    return buildCommandCenterViewModel({
      viewModel,
      handoff,
      copy,
      activitySources: activitySourcesFromMarketingSnapshots(marketingSnapshots),
      formatRelativeTime: (iso) => formatHomeRelativeTime(iso, copy),
    });
  }, [handoff, viewModel, copy, marketingSnapshots]);

  if (!handoff || !model) return null;

  return (
    <div className="command-center" data-layout-sections={COMMAND_CENTER_LAYOUT_SECTIONS.join(",")}>
      <div className="command-center__grid-texture" aria-hidden />
      <main className="command-center__page">
        <CommandCenterHeader />
        <CommandCenterIntro />
        <CommandCenterKpiGrid metrics={model.metrics} />
        <div className="command-center__section command-center__section--delay-15 command-center__row-two">
          <NeedsAttentionPanel panel={model.approvals} />
          <LiveActivityPanel items={model.activity} />
        </div>
        <AgentPerformanceGrid services={model.services} />
        <RevenueAttributionPanel roi={model.roi} />
      </main>
    </div>
  );
}
