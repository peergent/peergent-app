import type { PlanningNode, PlanningTimelineIntent } from "./types";

export type TimelineEngineInput = {
  nodes: readonly PlanningNode[];
  executionOrder: readonly string[];
  locale: "nl" | "en";
  campaignGoal: string;
};

/** Reason about timing intent — not calendar dates. */
export function buildPlanningTimeline(input: TimelineEngineInput): PlanningTimelineIntent[] {
  const nl = input.locale === "nl";
  const nodeById = new Map(input.nodes.map((n) => [n.id, n]));
  const phases: PlanningTimelineIntent[] = [];

  const foundationIds = input.nodes
    .filter((n) => n.dependsOn.length === 0 && /approval|strategy|readiness|foundation/i.test(n.id + n.title))
    .map((n) => n.id);

  const assetIds = input.nodes
    .filter((n) => /landing|tracking|asset|page|pixel/i.test(n.id + n.title))
    .map((n) => n.id);

  const channelIds = input.nodes
    .filter((n) => /channel|linkedin|meta|google|ads|email/i.test(n.id + n.title))
    .map((n) => n.id);

  const creativeIds = input.nodes
    .filter((n) => n.ownerBrain === "creative" || /content|creative|copy/i.test(n.id + n.title))
    .map((n) => n.id);

  const launchIds = input.nodes
    .filter((n) => /launch|publish|activate/i.test(n.id + n.title))
    .map((n) => n.id);

  const reviewIds = input.nodes
    .filter((n) => /review|performance|learn/i.test(n.id + n.title))
    .map((n) => n.id);

  if (foundationIds.length > 0) {
    phases.push({
      id: "phase-foundation",
      phase: nl ? "Fundament" : "Foundation",
      intent: nl
        ? "Strategie bevestigen en executie-voorwaarden vastleggen vóór enige spend."
        : "Confirm strategy and lock execution prerequisites before any spend.",
      nodeIds: foundationIds,
      requiresCustomerInput: true,
      happensAfterLaunch: false,
    });
  }

  if (assetIds.length > 0) {
    phases.push({
      id: "phase-assets",
      phase: nl ? "Assets & tracking" : "Assets & tracking",
      intent: nl
        ? "Landing page en tracking gereed maken — traffic vóór optimalisatie verlaagt conversiekwaliteit."
        : "Prepare landing page and tracking — traffic before optimization reduces conversion quality.",
      nodeIds: assetIds,
      parallelWith: creativeIds.length ? ["phase-creative-prep"] : undefined,
      requiresCustomerInput: assetIds.some((id) => /landing|customer/i.test(nodeById.get(id)?.title ?? "")),
      happensAfterLaunch: false,
    });
  }

  if (creativeIds.length > 0) {
    phases.push({
      id: "phase-creative-prep",
      phase: nl ? "Creative voorbereiding" : "Creative preparation",
      intent: nl
        ? "Creative voorbereiden parallel waar mogelijk — Creative Brain beslist HOW, niet Planning."
        : "Prepare creative in parallel where possible — Creative Brain decides HOW, not Planning.",
      nodeIds: creativeIds,
      parallelWith: assetIds.length ? ["phase-assets"] : undefined,
      requiresCustomerInput: false,
      happensAfterLaunch: false,
    });
  }

  if (channelIds.length > 0) {
    phases.push({
      id: "phase-channels",
      phase: nl ? "Kanaalactivatie" : "Channel activation",
      intent: nl
        ? "Kanalen activeren wanneer dependencies klaar zijn — niet alles tegelijk starten."
        : "Activate channels when dependencies are ready — not everything starts immediately.",
      nodeIds: channelIds,
      requiresCustomerInput: false,
      happensAfterLaunch: false,
    });
  }

  if (launchIds.length > 0) {
    phases.push({
      id: "phase-launch",
      phase: nl ? "Launch" : "Launch",
      intent: nl ? "Campagne live zetten wanneer readiness groen is." : "Go live when readiness is green.",
      nodeIds: launchIds,
      requiresCustomerInput: true,
      happensAfterLaunch: false,
    });
  }

  phases.push({
    id: "phase-post-launch",
    phase: nl ? "Na launch" : "After launch",
    intent: nl
      ? `Leren of ${input.campaignGoal} binnen verwachte termijn zichtbaar wordt.`
      : `Learn whether ${input.campaignGoal} becomes visible within the expected window.`,
    nodeIds: reviewIds.length ? reviewIds : input.executionOrder.slice(-1),
    requiresCustomerInput: false,
    happensAfterLaunch: true,
  });

  return phases;
}

export function deriveExecutionOrder(nodes: readonly PlanningNode[]): string[] {
  const remaining = new Map(nodes.map((n) => [n.id, n]));
  const order: string[] = [];
  const added = new Set<string>();

  while (remaining.size > 0) {
    let progressed = false;
    for (const [id, node] of remaining) {
      if (node.dependsOn.every((dep) => added.has(dep))) {
        order.push(id);
        added.add(id);
        remaining.delete(id);
        progressed = true;
      }
    }
    if (!progressed) {
      order.push(...remaining.keys());
      break;
    }
  }
  return order;
}
