import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CapabilityExecutionResult } from "../capabilities/execution-context";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { getBrainCapability } from "../capabilities/registry";
import {
  assumptionProvenance,
  campaignProvenance,
  profileProvenance,
  upstreamProvenance,
} from "../capabilities/shared/provenance";
import type { StrategyGraph, StrategySection } from "./strategy-graph";
import {
  buildDecisionsFromStrategyGraph,
  mapDecisionsToBrainDecisions,
  validateDecisionCollection,
} from "../decision";

function provenanceForSection(
  section: StrategySection,
  campaign: CampaignContext,
  orgId: string
) {
  const refs = [
    ...section.reasoningReferences.map((id) => ({
      kind: "brain_inference" as const,
      refId: `reasoning:${id}`,
      label: "reasoning_graph",
    })),
    ...section.supportingEvidence.map((id) => ({
      kind: "capability_output" as const,
      refId: id,
      label: "research_evidence",
    })),
    campaignProvenance(campaign.projectId, section.title),
  ];
  if (section.reasoningReferences.length === 0 && section.supportingEvidence.length === 0) {
    refs.push(profileProvenance(orgId, section.title));
  }
  return refs;
}

function findingFromSection(
  section: StrategySection,
  id: string,
  label: string,
  campaign: CampaignContext,
  orgId: string
): CapabilityExecutionResult["findings"][number] {
  return {
    id,
    label,
    value: section.description,
    confidence: section.confidence,
    provenance: provenanceForSection(section, campaign, orgId),
  };
}

/** Maps StrategyGraph → BrainStructuredOutput preserving Sprint 7.6 finding labels. */
export function mapStrategyGraphToBrainOutput(input: {
  graph: StrategyGraph;
  campaignContext: CampaignContext;
  organizationId: string;
  locale: "nl" | "en";
  brandCapabilityUsed?: boolean;
  websiteLimited?: boolean;
}): CapabilityExecutionResult {
  const def = getBrainCapability("strategy");
  const generatedAt = input.graph.createdAt;
  const base = emptyBrainStructuredOutput("strategy", def.version, generatedAt);
  const nl = input.locale === "nl";
  const campaign = input.campaignContext;
  const orgId = input.organizationId;
  const g = input.graph;

  const labels: Array<{ id: string; label: string; section: StrategySection }> = [
    { id: "strategy-1", label: nl ? "Bedrijfsdoel" : "Business objective", section: g.businessSummary },
    { id: "strategy-2", label: nl ? "Campagnedoel" : "Campaign objective", section: g.recommendedDirection },
    { id: "strategy-3", label: nl ? "Doelgroep" : "Target audience", section: g.primaryAudience },
    { id: "strategy-4", label: nl ? "Doelgroepprobleem" : "Audience problem", section: g.customerProblems },
    { id: "strategy-5", label: nl ? "Gewenst resultaat" : "Desired outcome", section: g.successCriteria },
    { id: "strategy-6", label: nl ? "Positionering" : "Positioning", section: g.strategicPositioning },
    { id: "strategy-7", label: nl ? "Waardepropositie" : "Value proposition", section: g.valueProposition },
    {
      id: "strategy-8",
      label: nl ? "Kernboodschap" : "Core message",
      section: {
        ...g.recommendedDirection,
        description: nl
          ? `${campaign.companyName} helpt ${g.primaryAudience.description} — ${g.valueProposition.description}.`
          : `${campaign.companyName} helps ${g.primaryAudience.description} — ${g.valueProposition.description}.`,
      },
    },
    {
      id: "strategy-9",
      label: nl ? "Ondersteunende boodschappen" : "Supporting messages",
      section: g.differentiators,
    },
    { id: "strategy-10", label: nl ? "Campagneconcept" : "Campaign concept", section: g.recommendedDirection },
    {
      id: "strategy-11",
      label: "Customer journey",
      section: {
        title: "Customer journey",
        description:
          g.customerMotivations.description ||
          (nl
            ? `${campaign.companyName} — van probleemherkenning naar vertrouwen en actie.`
            : `${campaign.companyName} — from problem recognition to trust and action.`),
        confidence: "medium",
        supportingEvidence: g.customerMotivations.supportingEvidence,
        reasoningReferences: g.customerMotivations.reasoningReferences,
      },
    },
    {
      id: "strategy-12",
      label: nl ? "Funnelfase" : "Funnel stage",
      section: {
        title: nl ? "Funnelfase" : "Funnel stage",
        description:
          g.buyingTriggers.description ||
          (nl ? "Beslissingsfase — geen generieke awareness-funnel." : "Decision stage — not a generic awareness funnel."),
        confidence: g.buyingTriggers.confidence,
        supportingEvidence: g.buyingTriggers.supportingEvidence,
        reasoningReferences: g.buyingTriggers.reasoningReferences,
      },
    },
    {
      id: "strategy-13",
      label: nl ? "Contentrichting" : "Content direction",
      section: g.strategicThemes[0] ?? {
        title: nl ? "Contentrichting" : "Content direction",
        description: nl ? "Context, bewijs, duidelijke vervolgstap" : "Context, proof, clear next step",
        confidence: "medium",
        supportingEvidence: [],
        reasoningReferences: [],
      },
    },
    {
      id: "strategy-14",
      label: nl ? "Kanaalhypothese" : "Channel hypothesis",
      section: {
        title: nl ? "Kanaalhypothese" : "Channel hypothesis",
        description: campaign.selectedChannels.length
          ? campaign.selectedChannels.join(", ")
          : nl
            ? "Kanalen nog te kiezen"
            : "Channels still to be selected",
        confidence: "medium",
        supportingEvidence: [],
        reasoningReferences: [],
      },
    },
    {
      id: "strategy-15",
      label: nl ? "CTA-strategie" : "CTA strategy",
      section: g.buyingTriggers,
    },
    {
      id: "strategy-16",
      label: nl ? "KPI-kader" : "KPI framework",
      section: g.successCriteria,
    },
    {
      id: "strategy-17",
      label: nl ? "Risico's" : "Risks",
      section: {
        title: nl ? "Risico's" : "Risks",
        description: g.strategicRisks.map((r) => r.description).join(" · ") || (nl ? "Geen" : "None"),
        confidence: g.strategicRisks.length ? "medium" : "low",
        supportingEvidence: g.strategicRisks.flatMap((r) => r.supportingEvidence),
        reasoningReferences: g.strategicRisks.flatMap((r) => r.reasoningReferences),
      },
    },
    {
      id: "strategy-18",
      label: nl ? "Aannames" : "Assumptions",
      section: {
        title: nl ? "Aannames" : "Assumptions",
        description: g.assumptions.map((a) => a.description).join(" · ") || g.evidenceSummary.description,
        confidence: "medium",
        supportingEvidence: g.assumptions.flatMap((a) => a.supportingEvidence),
        reasoningReferences: g.assumptions.flatMap((a) => a.reasoningReferences),
      },
    },
    {
      id: "strategy-19",
      label: nl ? "Onbekenden" : "Unknowns",
      section: {
        title: nl ? "Onbekenden" : "Unknowns",
        description: g.unknowns.map((u) => u.title).join(", ") || (nl ? "Geen" : "None"),
        confidence: "low",
        supportingEvidence: [],
        reasoningReferences: g.unknowns.flatMap((u) => u.reasoningReferences),
      },
    },
  ];

  const findings = labels.map(({ id, label, section }) =>
    findingFromSection(section, id, label, campaign, orgId)
  );

  const decisionCollection = buildDecisionsFromStrategyGraph({
    graph: g,
    campaignContext: campaign,
    locale: input.locale,
  });
  validateDecisionCollection(decisionCollection);

  const decisions = mapDecisionsToBrainDecisions(decisionCollection, campaign.projectId);

  return {
    ...base,
    findings,
    decisions,
    decisionRecords: decisionCollection.decisions,
    recommendations: [
      {
        id: "rec-strategy-next",
        label: nl ? "Volgende stap: kanalen kiezen" : "Next step: select channels",
        priority: "high",
        provenance: [campaignProvenance(campaign.projectId, "strategy")],
      },
    ],
    warnings: input.websiteLimited
      ? [
          {
            id: "warn-strategy-website",
            code: "website_limitation",
            message: nl
              ? "Websitecontext beperkt — strategie gebruikt ReasoningGraph en campagne-input."
              : "Website context limited — strategy uses ReasoningGraph and campaign input.",
            provenance: [assumptionProvenance("website_unavailable")],
          },
        ]
      : [],
    actionProposals: [
      {
        id: "act-strategy-approve",
        actionType: "approve_strategy",
        label: nl ? "Strategie bevestigen" : "Confirm strategy",
        requiresApproval: true,
        provenance: [campaignProvenance(campaign.projectId, "strategy")],
      },
    ],
  };
}
