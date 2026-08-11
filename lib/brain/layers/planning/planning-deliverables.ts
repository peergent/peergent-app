import type { CreativeBriefInput, PlannedDeliverable, PlanningEntityStatus } from "./brain-types";
import type { StrategyPlanningContext } from "./brain-types";
import { enforcePlanningConfidenceCeiling } from "./planning-confidence";

export function buildDeliverables(input: {
  ctx: StrategyPlanningContext;
  campaignId: string;
  upstreamConfidence: "low" | "medium" | "high";
}): { deliverables: PlannedDeliverable[]; briefs: CreativeBriefInput[] } {
  const deliverables: PlannedDeliverable[] = [];
  const briefs: CreativeBriefInput[] = [];
  const primaryAudience =
    input.ctx.audienceStrategy.find((a) => a.priority === "primary")?.segment ??
    input.ctx.planningInput.selectedAudiences[0] ??
    "Primary audience";

  for (const ch of input.ctx.channelStrategy.filter((c) => c.selected)) {
    const deliverableId = `del-${campaignSlug(input.campaignId)}-${slug(ch.channel)}`;
    const briefId = `brief-${deliverableId}`;
    const type = inferDeliverableType(ch.channel, ch.paidOrOrganic);

    const brief: CreativeBriefInput = {
      id: briefId,
      campaignObjective: input.ctx.campaignObjectives[0]?.objective ?? input.ctx.planningInput.selectedObjectives[0] ?? "",
      businessOutcome: input.ctx.campaignObjectives[0]?.businessOutcome ?? "Pipeline growth",
      targetAudience: [primaryAudience],
      channel: ch.channel,
      channelRole: ch.role,
      funnelStage: ch.funnelStage,
      positioningDirection: input.ctx.positioningStrategy.strategicAngle,
      messagingDirection: input.ctx.messagingDirection.primaryMessageTerritory,
      offerDirection: input.ctx.offerDirection.offerDirection,
      proofRequirements: input.ctx.positioningStrategy.proofRequirements,
      objections: input.ctx.messagingDirection.objectionThemes,
      ctaType: input.ctx.offerDirection.ctaType,
      brandConstraints: input.ctx.planningInput.constraints,
      contentRequirements: input.ctx.funnelStrategy.contentRequirements.slice(0, 3),
      deliverableType: type,
      successMetric: input.ctx.campaignObjectives[0]?.successMetric ?? input.ctx.kpis[0] ?? "Qualified leads",
      constraints: input.ctx.planningInput.constraints,
      deadlineWindow: null,
      strategyDecisionRefs: input.ctx.decisions.filter((d) => d.decisionType === "channel").map((d) => d.id),
      planningRefs: [deliverableId],
      confidence: enforcePlanningConfidenceCeiling(ch.confidence, [input.upstreamConfidence]),
    };

    briefs.push(brief);
    deliverables.push({
      id: deliverableId,
      campaignId: input.campaignId,
      type,
      channel: ch.channel,
      objective: ch.objective,
      audience: [primaryAudience],
      purpose: `Deliver ${type} for ${ch.role}`,
      strategyRefs: ch.evidenceIds,
      requiredInputs: ["CreativeBriefInput", "ChannelStrategy"],
      expectedOutputType: type,
      priority: ch.priority === "high" ? "high" : "medium",
      approvalRequired: true,
      validationRequired: true,
      executionRequired: ch.paidOrOrganic !== "none",
      dependencies: ["gate-strategy-review"],
      creativeBriefInputId: briefId,
      status: "NOT_STARTED",
    });
  }

  if (input.ctx.funnelStrategy.conversionPoints.length > 0) {
    const landingId = `del-${campaignSlug(input.campaignId)}-landing-page`;
    deliverables.push({
      id: landingId,
      campaignId: input.campaignId,
      type: "Landing page",
      channel: "Website",
      objective: "Convert high-intent traffic",
      audience: [primaryAudience],
      purpose: "Support conversion points defined in funnel strategy",
      strategyRefs: [],
      requiredInputs: ["FunnelStrategy", "OfferStrategyDirection"],
      expectedOutputType: "Landing page brief",
      priority: "high",
      approvalRequired: true,
      validationRequired: true,
      executionRequired: false,
      dependencies: ["gate-strategy-review"],
      creativeBriefInputId: null,
      status: "NOT_STARTED",
    });
  }

  return { deliverables, briefs };
}

function inferDeliverableType(channel: string, paidOrOrganic: string): string {
  const lower = channel.toLowerCase();
  if (lower.includes("email")) return "Email sequence";
  if (lower.includes("google") || lower.includes("search")) return "Google Search campaign";
  if (lower.includes("linkedin")) return "LinkedIn campaign";
  if (lower.includes("meta") || lower.includes("facebook")) return "Paid social campaign";
  if (paidOrOrganic === "organic") return "Organic content series";
  return "Channel campaign";
}

function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-");
}

function campaignSlug(id: string): string {
  return id.replace("camp-plan-", "");
}
