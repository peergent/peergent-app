import type { CreativeGraph } from "@/lib/brain/layers/creative/types";
import { sanitizeCustomerText } from "../sanitize";
import type { CreativeStrategyAssetOutput } from "../types";
import { channelLabel } from "./creative-source";

function assetKindForChannel(channel: string): CreativeStrategyAssetOutput["kind"] {
  switch (channel) {
    case "linkedin":
      return "linkedin";
    case "google_ads":
    case "meta_ads":
      return "ads";
    case "email":
    case "newsletter":
      return "email";
    case "blog":
      return "blog";
    case "landing_page":
    case "website_landing":
      return "landing";
    default:
      return "display";
  }
}

function formatAssetPreview(input: {
  purpose: string;
  audience: string;
  objective: string;
  outcome: string;
  role: string;
  nl: boolean;
}): string {
  const lines = [
    input.nl ? `Doel: ${input.purpose}` : `Purpose: ${input.purpose}`,
    input.nl ? `Doelgroep: ${input.audience}` : `Audience: ${input.audience}`,
    input.nl ? `Kanaaldoel: ${input.objective}` : `Channel objective: ${input.objective}`,
    input.nl ? `Verwachte impact: ${input.outcome}` : `Expected impact: ${input.outcome}`,
    input.nl ? `Rol in campagne: ${input.role}` : `Role in campaign: ${input.role}`,
  ];
  return lines.join("\n");
}

/** Map CreativeGraph deliverables → Creative Strategy assets for UI. */
export function publishCreativeStrategyAssets(input: {
  creative: CreativeGraph | null;
  nl: boolean;
}): readonly CreativeStrategyAssetOutput[] {
  if (!input.creative) return [];

  const selected = input.creative.campaigns.find((c) => c.selected) ?? input.creative.campaigns[0];

  return input.creative.deliverables.map((del) => {
    const plan = input.creative!.channelPlans.find((p) => p.channel === del.channel);
    const chLabel = channelLabel(del.channel, input.nl);

    const purpose = sanitizeCustomerText(plan?.why ?? del.rationale) ?? "";
    const audience = sanitizeCustomerText(plan?.audience ?? selected?.targetAudience ?? "") ?? "";
    const objective = sanitizeCustomerText(plan?.goal ?? selected?.objective ?? "") ?? "";
    const outcome = sanitizeCustomerText(selected?.estimatedImpact ?? input.creative!.estimatedBusinessImpact) ?? "";
    const role =
      sanitizeCustomerText(
        input.nl
          ? `Ondersteunt "${selected?.name ?? "campagne"}" via ${chLabel}.`
          : `Supports "${selected?.name ?? "campaign"}" through ${chLabel}.`
      ) ?? "";

    return {
      id: del.id,
      kind: assetKindForChannel(del.channel),
      channelLabel: chLabel,
      title: del.headline || chLabel,
      preview: formatAssetPreview({ purpose, audience, objective, outcome, role, nl: input.nl }),
      statusLabel: input.nl ? "Klaar voor review" : "Ready for review",
      statusTone: del.reviewStatus === "planned" ? "review" : "draft",
    };
  });
}

export function publishLiveCampaignIntelligence(input: {
  creative: CreativeGraph | null;
  campaignId: string;
  nl: boolean;
}): import("../types").LiveCampaignIntelligence | null {
  if (!input.creative) return null;
  const selected = input.creative.campaigns.find((c) => c.selected) ?? input.creative.campaigns[0];
  if (!selected) return null;

  const decision = input.creative.decisions[0];
  const rejectedCount = input.creative.discardedIdeas.filter(
    (d) => d.phase === "generate_campaign_concepts"
  ).length;

  return {
    campaignId: input.campaignId,
    angle: input.creative.direction?.angle ?? selected.keyMessage,
    primaryMessage: selected.keyMessage,
    reasonSelected: decision
      ? decision.reason
      : rejectedCount
        ? input.nl
          ? `${rejectedCount} alternatieven afgewezen — "${selected.name}" bood de sterkste business fit.`
          : `${rejectedCount} alternatives rejected — "${selected.name}" offered the strongest business fit.`
        : input.nl
          ? `"${selected.name}" scoorde het hoogst op business value en emotional fit.`
          : `"${selected.name}" scored highest on business value and emotional fit.`,
    expectedOutcome: selected.estimatedImpact,
  };
}

export function publishExecutiveApprovalActions(input: {
  creative: CreativeGraph | null;
  approvalReason: import("../types").ApprovalReason | null;
  nl: boolean;
  href?: string | null;
}): readonly import("../types").ExecutiveApprovalAction[] {
  if (!input.approvalReason && !input.creative) return [];

  const selected = input.creative?.campaigns.find((c) => c.selected) ?? input.creative?.campaigns[0];

  return [
    {
      id: "approval-creative-concept",
      title: input.nl ? "Goedkeuring vereist" : "Approval required",
      reason: input.nl
        ? `Emma koos campagneconcept "${selected?.name ?? "primair"}".`
        : `Emma selected campaign concept "${selected?.name ?? "primary"}".`,
      businessImpact: input.approvalReason?.expectedImpact ??
        selected?.estimatedImpact ??
        (input.nl
          ? "Campagnestart vertraagd tot goedkeuring."
          : "Campaign launch delayed until approved."),
      primaryLabel: input.nl ? "Campagne beoordelen" : "Review campaign",
      href: input.href ?? null,
    },
  ];
}
