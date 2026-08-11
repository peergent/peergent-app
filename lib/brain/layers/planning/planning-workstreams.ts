import type { PlanningEntityStatus, Workstream } from "./brain-types";
import type { StrategyPlanningContext } from "./brain-types";

const WORKSTREAM_TEMPLATES = [
  { name: "Campaign setup", purpose: "Operational setup for campaign execution", ownerType: "planning" as const },
  { name: "Creative development", purpose: "Prepare creative deliverables via Creative Brain", ownerType: "creative" as const },
  { name: "Tracking / measurement", purpose: "Analytics and conversion tracking readiness", ownerType: "planning" as const },
  { name: "Approval", purpose: "Customer and internal approval checkpoints", ownerType: "customer" as const },
  { name: "Publishing preparation", purpose: "Prepare Execution Brain handoff", ownerType: "execution" as const },
];

export function buildWorkstreams(input: {
  ctx: StrategyPlanningContext;
  campaignId: string;
  startWindow: string | null;
  endWindow: string | null;
}): Workstream[] {
  const selectedChannels = input.ctx.channelStrategy.filter((c) => c.selected);
  const streams: Workstream[] = WORKSTREAM_TEMPLATES.map((t, i) => ({
    id: `ws-${input.campaignId}-${i}`,
    campaignId: input.campaignId,
    name: t.name,
    purpose: t.purpose,
    ownerType: t.ownerType,
    priority: i === 1 ? "high" : "medium",
    dependencies: i > 0 ? [`ws-${input.campaignId}-0`] : [],
    milestoneIds: [],
    workPackageIds: [],
    status: "NOT_STARTED" as PlanningEntityStatus,
    startWindow: input.startWindow,
    endWindow: input.endWindow,
  }));

  for (const ch of selectedChannels) {
    streams.push({
      id: `ws-${input.campaignId}-${ch.channel.toLowerCase().replace(/\s+/g, "-")}`,
      campaignId: input.campaignId,
      name: `${ch.channel} channel setup`,
      purpose: `Operationalize ${ch.role} on ${ch.channel}`,
      ownerType: ch.paidOrOrganic === "paid" ? "execution" : "creative",
      priority: ch.priority === "high" ? "high" : "medium",
      dependencies: [`ws-${input.campaignId}-0`],
      milestoneIds: [],
      workPackageIds: [],
      status: "NOT_STARTED",
      startWindow: input.startWindow,
      endWindow: input.endWindow,
    });
  }

  return streams;
}
