import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CompanySnapshot } from "../company/snapshot";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { ResearchGraph } from "../layers/research/types";
import type { ReasoningGraph, ReasoningNode, ReasoningOpportunity, ReasoningRisk } from "../layers/reasoning/types";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence/types";
import type {
  RejectedAlternative,
  StrategyDecisionRecord,
  StrategyGraph,
  StrategySection,
} from "./strategy-graph";
import { STRATEGY_GRAPH_VERSION } from "./strategy-graph";
import { pickReasoningNode, reasoningConfidenceToBrain, miConfidenceToBrain, type StrategySourceBundle } from "./strategy-sources";
import {
  buildConsultantDecisionRationale,
  enrichRecommendedDirection,
  mergeRejectedAlternatives,
} from "./strategy-consultant-decisions";

export type BuildStrategyGraphInput = {
  sources: StrategySourceBundle;
  companySnapshot: CompanySnapshot;
  campaignContext: CampaignContext;
  locale: "nl" | "en";
};

function sectionFromNode(node: ReasoningNode, title?: string): StrategySection {
  return {
    title: title ?? node.title,
    description: node.description,
    confidence: reasoningConfidenceToBrain(node.confidence),
    supportingEvidence: [...node.supportingEvidence],
    reasoningReferences: [node.id],
  };
}

function unknownSection(title: string, reason: string, nl: boolean): StrategySection {
  return {
    title,
    description: nl ? `Onbekend — ${reason}` : `Unknown — ${reason}`,
    confidence: "low",
    supportingEvidence: [],
    reasoningReferences: [],
  };
}

function legacyFinding(
  legacy: StrategySourceBundle["legacy"],
  capabilityId: keyof StrategySourceBundle["legacy"],
  findingId: string
): string | undefined {
  return legacy[capabilityId]?.findings.find((f) => f.id === findingId)?.value;
}

function joinNodes(nodes: readonly ReasoningNode[], fallback: string): string {
  if (nodes.length === 0) return fallback;
  return nodes.map((n) => n.description).join(" · ");
}

function buildRejectedAlternatives(reasoning: ReasoningGraph | null, nl: boolean): RejectedAlternative[] {
  if (!reasoning) return [];
  const rejected: RejectedAlternative[] = [];

  if (reasoning.marketPosition.some((n) => /budget/i.test(n.title))) {
    rejected.push({
      alternative: nl ? "Concurreren op prijs" : "Compete on price",
      reason: nl
        ? "Geen bewijs voor structureel prijsvoordeel in ReasoningGraph."
        : "No evidence for structural price advantage in ReasoningGraph.",
      confidence: "medium",
    });
  }

  rejected.push({
    alternative: nl ? "Generieke breedte-campagne" : "Generic broad-reach campaign",
    reason: nl
      ? "ReasoningGraph wijst op specifieke doelgroep — brede campagne past niet bij het bewijs."
      : "ReasoningGraph indicates a specific audience — broad campaign does not match evidence.",
    confidence: reasoning.customerModel.length > 0 ? "high" : "medium",
  });

  rejected.push({
    alternative: nl ? "Directe product-push zonder context" : "Direct product push without context",
    reason: nl
      ? "Klantprobleem en positionering vereisen context vóór conversie."
      : "Customer problem and positioning require context before conversion.",
    confidence: "medium",
  });

  return rejected.slice(0, 3);
}

function opportunitiesToSections(opportunities: readonly ReasoningOpportunity[]): StrategySection[] {
  return opportunities.slice(0, 3).map((opp, i) => ({
    title: opp.title,
    description: opp.description,
    confidence: reasoningConfidenceToBrain(opp.confidence),
    supportingEvidence: [...opp.supportingEvidence],
    reasoningReferences: [opp.id],
  }));
}

function risksToSections(risks: readonly ReasoningRisk[]): StrategySection[] {
  return risks.slice(0, 5).map((risk) => ({
    title: risk.title,
    description: `${risk.description} (${risk.severity} severity)`,
    confidence: reasoningConfidenceToBrain(risk.confidence),
    supportingEvidence: [...risk.supportingEvidence],
    reasoningReferences: [risk.id],
  }));
}

function buildFromReasoning(input: BuildStrategyGraphInput): StrategyGraph {
  const { sources, companySnapshot, campaignContext, locale } = input;
  const nl = locale === "nl";
  const reasoning = sources.reasoning!;
  const research = sources.research;
  const profile = companySnapshot.profile;
  const goals = campaignContext.goals.filter((g) => g.trim().length > 3);
  const companyName = campaignContext.companyName || profile.companyName.value || "Company";
  const createdAt = new Date().toISOString();

  const whatIsSold = pickReasoningNode(reasoning, (n) => n.id === "business:what-is-sold");
  const whoBuys = pickReasoningNode(reasoning, (n) => n.id === "business:who-buys" || n.id === "customer:icp");
  const differentiation = pickReasoningNode(reasoning, (n) => n.id === "business:differentiation");

  const marketPosition =
    reasoning.marketPosition.find((n) => n.confidence > 0 && !/unknown/i.test(n.title)) ??
    reasoning.marketPosition[0];

  const businessSummary: StrategySection = {
    title: nl ? "Bedrijfssamenvatting" : "Business summary",
    description: [
      companyName,
      whatIsSold?.description,
      profile.industry.value,
    ]
      .filter(Boolean)
      .join(" — "),
    confidence: whatIsSold ? reasoningConfidenceToBrain(whatIsSold.confidence) : "medium",
    supportingEvidence: whatIsSold?.supportingEvidence ?? [],
    reasoningReferences: whatIsSold ? [whatIsSold.id] : [],
  };

  const strategicPositioning: StrategySection = marketPosition
    ? sectionFromNode(marketPosition, nl ? "Strategische positionering" : "Strategic positioning")
    : unknownSection(
        nl ? "Strategische positionering" : "Strategic positioning",
        nl ? "onvoldoende marktpositie-evidence" : "insufficient market position evidence",
        nl
      );

  const valueProposition: StrategySection = differentiation
    ? sectionFromNode(differentiation, nl ? "Waardepropositie" : "Value proposition")
    : {
        title: nl ? "Waardepropositie" : "Value proposition",
        description:
          profile.positioning.value ??
          legacyFinding(sources.legacy, "brand_understanding", "brand-value-prop") ??
          (nl ? "Nog onbekend" : "Still unknown"),
        confidence: profile.positioning.customerConfirmed ? "high" : "medium",
        supportingEvidence: [],
        reasoningReferences: [],
      };

  const primaryAudience: StrategySection = whoBuys
    ? sectionFromNode(whoBuys, nl ? "Primaire doelgroep" : "Primary audience")
    : {
        title: nl ? "Primaire doelgroep" : "Primary audience",
        description: campaignContext.audience.trim() || profile.targetAudiences.value?.[0] || (nl ? "Nog onbekend" : "Still unknown"),
        confidence: campaignContext.audience.trim() ? "high" : "low",
        supportingEvidence: [],
        reasoningReferences: [],
      };

  const customerProblems: StrategySection = {
    title: nl ? "Klantproblemen" : "Customer problems",
    description:
      campaignContext.extraContext.trim() ||
      (nl
        ? `${companyName} lost een probleem op voor ${primaryAudience.description}.`
        : `${companyName} solves a problem for ${primaryAudience.description}.`),
    confidence: campaignContext.extraContext.trim() ? "medium" : "low",
    supportingEvidence: [],
    reasoningReferences: whoBuys ? [whoBuys.id] : [],
  };

  const strategicThemes = reasoning.strategicThemes.map((t) => sectionFromNode(t));
  const priorityOpportunities = opportunitiesToSections(reasoning.opportunities);
  const strategicRisks = risksToSections(reasoning.risks);

  const unknowns: StrategySection[] = reasoning.unknowns.map((u) => ({
    title: u.title,
    description: u.reason,
    confidence: "low",
    supportingEvidence: [],
    reasoningReferences: [u.id],
  }));

  const assumptions: StrategySection[] = reasoning.assumptions.map((a) => sectionFromNode(a));

  const constraints: StrategySection[] = reasoning.constraints.map((c) => sectionFromNode(c));

  const rejectedAlternatives = buildRejectedAlternatives(reasoning, nl);

  const recommendedDirection: StrategySection = {
    title: nl ? "Aanbevolen richting" : "Recommended direction",
    description: nl
      ? `${companyName} richt zich op ${primaryAudience.description} met ${strategicPositioning.description.toLowerCase()} en focus op ${goals[0] ?? campaignContext.description}.`
      : `${companyName} focuses on ${primaryAudience.description} with ${strategicPositioning.description.toLowerCase()} positioning toward ${goals[0] ?? campaignContext.description}.`,
    confidence: reasoning.priorityInsights[0]
      ? reasoningConfidenceToBrain(reasoning.priorityInsights[0].confidence)
      : "medium",
    supportingEvidence: reasoning.priorityInsights[0]?.supportingEvidence ?? [],
    reasoningReferences: reasoning.priorityInsights.map((p) => p.id),
  };

  const decisionRationales: StrategyDecisionRecord[] = [
    {
      decision: recommendedDirection.description,
      reason: nl
        ? "Gebaseerd op ReasoningGraph — bedrijfsmodel, doelgroep, positionering en prioritaire kansen."
        : "Based on ReasoningGraph — business model, audience, positioning, and priority opportunities.",
      evidence: recommendedDirection.supportingEvidence,
      alternativesConsidered: rejectedAlternatives.map((a) => a.alternative),
      alternativesRejected: rejectedAlternatives,
      confidence: recommendedDirection.confidence,
      risks: strategicRisks.map((r) => r.title),
      unknowns: unknowns.map((u) => u.title),
      futureValidation: nl ? "Valideer na aanvullend research" : "Validate after additional research",
    },
  ];

  const evidenceIds = [
    ...businessSummary.supportingEvidence,
    ...strategicPositioning.supportingEvidence,
    ...valueProposition.supportingEvidence,
    ...(research
      ? [
          ...research.company.slice(0, 2).map((e) => e.id),
          ...research.audience.slice(0, 2).map((e) => e.id),
        ]
      : []),
  ];

  return {
    version: STRATEGY_GRAPH_VERSION,
    organizationId: companySnapshot.organizationId,
    campaignId: campaignContext.projectId,
    createdAt,
    businessSummary,
    strategicPositioning,
    valueProposition,
    primaryAudience,
    customerProblems,
    customerMotivations: {
      title: nl ? "Klantmotivaties" : "Customer motivations",
      description: joinNodes(reasoning.customerModel, nl ? "Nog te bevestigen" : "Still to be confirmed"),
      confidence: reasoning.customerModel.length ? "medium" : "low",
      supportingEvidence: reasoning.customerModel.flatMap((n) => n.supportingEvidence),
      reasoningReferences: reasoning.customerModel.map((n) => n.id),
    },
    buyingTriggers: {
      title: nl ? "Aankooptriggers" : "Buying triggers",
      description: goals.slice(0, 2).join(" · ") || campaignContext.description,
      confidence: goals.length ? "medium" : "low",
      supportingEvidence: [],
      reasoningReferences: [],
    },
    objections: {
      title: nl ? "Bezwaren" : "Objections",
      description:
        reasoning.contradictions.length > 0
          ? reasoning.contradictions.map((c) => c.description).join(" · ")
          : nl
            ? "Geen bevestigde bezwaren — onzekerheid blijft zichtbaar."
            : "No confirmed objections — uncertainty remains visible.",
      confidence: reasoning.contradictions.length ? "medium" : "low",
      supportingEvidence: [],
      reasoningReferences: reasoning.contradictions.map((c) => c.id),
    },
    differentiators: {
      title: nl ? "Differentiators" : "Differentiators",
      description:
        differentiation?.description ??
        profile.uniqueSellingPoints.value?.join(" · ") ??
        (nl ? "Nog onbekend" : "Still unknown"),
      confidence: differentiation ? reasoningConfidenceToBrain(differentiation.confidence) : "low",
      supportingEvidence: differentiation?.supportingEvidence ?? [],
      reasoningReferences: differentiation ? [differentiation.id] : [],
    },
    strategicThemes,
    priorityOpportunities,
    strategicRisks,
    constraints,
    assumptions,
    unknowns,
    evidenceSummary: {
      title: nl ? "Evidence-samenvatting" : "Evidence summary",
      description: nl
        ? `${evidenceIds.length} evidence-referenties via ReasoningGraph en ResearchGraph.`
        : `${evidenceIds.length} evidence references via ReasoningGraph and ResearchGraph.`,
      confidence: evidenceIds.length >= 3 ? "high" : evidenceIds.length ? "medium" : "low",
      supportingEvidence: evidenceIds,
      reasoningReferences: reasoning.priorityInsights.map((p) => p.id),
    },
    rejectedAlternatives,
    decisionRationales,
    recommendedDirection,
    successCriteria: {
      title: nl ? "Succescriteria" : "Success criteria",
      description: nl
        ? `Voor ${companyName}: ${goals.join(" · ") || campaignContext.description}. Meetbare business-outcome — geen numerieke beloftes.`
        : `For ${companyName}: ${goals.join(" · ") || campaignContext.description}. Measurable business outcome — no numeric promises.`,
      confidence: "medium",
      supportingEvidence: [],
      reasoningReferences: [],
    },
  };
}

/** Builds StrategyGraph — MarketingIntelligence → Reasoning → Legacy. */
export function buildStrategyGraph(input: BuildStrategyGraphInput): StrategyGraph {
  if (input.sources.marketingIntelligence) {
    return buildFromMarketingIntelligence(input);
  }
  if (input.sources.reasoning) {
    return buildFromReasoning(input);
  }
  return buildFromLegacy(input);
}

function insightSection(
  insight: { title: string; narrative: string; confidence: number; supportingEvidence: readonly string[]; reasoningReferences: readonly string[] },
  fallbackTitle: string
): StrategySection {
  return {
    title: insight.title || fallbackTitle,
    description: insight.narrative,
    confidence: miConfidenceToBrain(insight.confidence),
    supportingEvidence: [...insight.supportingEvidence],
    reasoningReferences: [...insight.reasoningReferences],
  };
}

function buildFromMarketingIntelligence(input: BuildStrategyGraphInput): StrategyGraph {
  const { sources, companySnapshot, campaignContext, locale } = input;
  const nl = locale === "nl";
  const mi = sources.marketingIntelligence!;
  const reasoning = sources.reasoning;
  const research = sources.research;
  const profile = companySnapshot.profile;
  const goals = campaignContext.goals.filter((g) => g.trim().length > 3);
  const companyName = campaignContext.companyName || profile.companyName.value || "Company";
  const createdAt = new Date().toISOString();
  const audience =
    campaignContext.audience.trim() || profile.targetAudiences.value?.[0] || (nl ? "Nog onbekend" : "Still unknown");

  const businessSummary = insightSection(mi.businessReality, nl ? "Bedrijfssamenvatting" : "Business summary");
  const strategicPositioning = insightSection(
    mi.strongestPositioning,
    nl ? "Strategische positionering" : "Strategic positioning"
  );
  const valueProposition = insightSection(
    mi.dominantMessaging,
    nl ? "Waardepropositie" : "Value proposition"
  );
  const primaryAudience: StrategySection = {
    title: nl ? "Primaire doelgroep" : "Primary audience",
    description: nl
      ? `${audience} — gekozen omdat ${mi.primaryPain.narrative}`
      : `${audience} — chosen because ${mi.primaryPain.narrative}`,
    confidence: miConfidenceToBrain(mi.primaryPain.confidence),
    supportingEvidence: [...mi.primaryPain.supportingEvidence],
    reasoningReferences: [...mi.primaryPain.reasoningReferences],
  };

  const customerProblems = insightSection(mi.primaryPain, nl ? "Klantproblemen" : "Customer problems");
  const customerMotivations = insightSection(mi.buyingMotivation, nl ? "Klantmotivaties" : "Customer motivations");

  const strategicThemes = mi.highestProbabilityCampaigns.map((c) =>
    insightSection(c, nl ? "Strategisch thema" : "Strategic theme")
  );

  const priorityOpportunities = strategicThemes;
  const strategicRisks: StrategySection[] =
    reasoning?.risks.map((risk) => ({
      title: risk.title,
      description: `${risk.description} (${risk.severity} severity)`,
      confidence: reasoningConfidenceToBrain(risk.confidence),
      supportingEvidence: [...risk.supportingEvidence],
      reasoningReferences: [risk.id],
    })) ?? [];

  const unknowns: StrategySection[] = mi.missingInformation.map((u) => insightSection(u, u.title));
  const assumptions: StrategySection[] = mi.assumptions.map((a) => insightSection(a, a.title));

  const rejectedAlternatives = mergeRejectedAlternatives(
    buildRejectedAlternatives(reasoning ?? null, nl),
    mi.antiPatterns.map((anti) => ({
      alternative: anti.title,
      reason: anti.narrative,
      confidence: miConfidenceToBrain(anti.confidence),
    }))
  );

  const recommendedDirection = enrichRecommendedDirection({
    section: {
      title: nl ? "Aanbevolen richting" : "Recommended direction",
      description: mi.dominantMessaging.narrative,
      confidence: miConfidenceToBrain(mi.dominantMessaging.confidence),
      supportingEvidence: [...mi.dominantMessaging.supportingEvidence],
      reasoningReferences: [...mi.dominantMessaging.reasoningReferences],
    },
    companyName,
    audience,
    goal: goals[0] ?? campaignContext.description,
    mi,
    locale,
  });

  const buyingTriggers: StrategySection = {
    title: nl ? "Aankooptriggers" : "Buying triggers",
    description: mi.emotionalDrivers.narrative,
    confidence: miConfidenceToBrain(mi.emotionalDrivers.confidence),
    supportingEvidence: [...mi.emotionalDrivers.supportingEvidence],
    reasoningReferences: [...mi.emotionalDrivers.reasoningReferences],
  };

  const differentiators = insightSection(mi.competitiveAdvantage, nl ? "Differentiators" : "Differentiators");

  const successCriteria: StrategySection = {
    title: nl ? "Succescriteria" : "Success criteria",
    description: nl
      ? `Voor ${companyName}: ${goals.join(" · ") || campaignContext.description}. Meetbare business-outcome — geen numerieke beloftes.`
      : `For ${companyName}: ${goals.join(" · ") || campaignContext.description}. Measurable business outcome — no numeric promises.`,
    confidence: "medium",
    supportingEvidence: [],
    reasoningReferences: [],
  };

  const decisionRationales: StrategyDecisionRecord[] = [
    buildConsultantDecisionRationale({
      recommendedDirection,
      rejectedAlternatives,
      strategicRisks,
      unknowns,
      successCriteria,
      buyingTriggers,
      differentiators,
      campaignContext,
      marketingIntelligence: mi,
      locale,
    }),
  ];

  const evidenceIds = [
    ...businessSummary.supportingEvidence,
    ...strategicPositioning.supportingEvidence,
    ...(research
      ? [...research.company.slice(0, 2).map((e) => e.id), ...research.audience.slice(0, 2).map((e) => e.id)]
      : []),
  ];

  return {
    version: STRATEGY_GRAPH_VERSION,
    organizationId: companySnapshot.organizationId,
    campaignId: campaignContext.projectId,
    createdAt,
    businessSummary,
    strategicPositioning,
    valueProposition,
    primaryAudience,
    customerProblems,
    customerMotivations,
    buyingTriggers,
    objections: insightSection(mi.objections, nl ? "Bezwaren" : "Objections"),
    differentiators,
    strategicThemes,
    priorityOpportunities,
    strategicRisks,
    constraints: reasoning?.constraints.map((c) => sectionFromNode(c)) ?? [],
    assumptions,
    unknowns,
    evidenceSummary: {
      title: nl ? "Evidence-samenvatting" : "Evidence summary",
      description: nl
        ? `${evidenceIds.length} evidence-referenties via Marketing Intelligence, ReasoningGraph en ResearchGraph.`
        : `${evidenceIds.length} evidence references via Marketing Intelligence, ReasoningGraph, and ResearchGraph.`,
      confidence: evidenceIds.length >= 3 ? "high" : evidenceIds.length ? "medium" : "low",
      supportingEvidence: evidenceIds,
      reasoningReferences: mi.dominantMessaging.reasoningReferences,
    },
    rejectedAlternatives,
    decisionRationales,
    recommendedDirection,
    successCriteria,
  };
}

function buildFromLegacy(input: BuildStrategyGraphInput): StrategyGraph {
  const { companySnapshot, campaignContext, locale, sources } = input;
  const nl = locale === "nl";
  const profile = companySnapshot.profile;
  const goals = campaignContext.goals;
  const companyName = campaignContext.companyName || profile.companyName.value || "Company";
  const createdAt = new Date().toISOString();

  const audience =
    campaignContext.audience.trim() || profile.targetAudiences.value?.[0] || (nl ? "Nog onbekend" : "Still unknown");
  const positioning =
    profile.positioning.value ??
    legacyFinding(sources.legacy, "brand_understanding", "brand-positioning") ??
    (nl ? "Nog onbekend" : "Still unknown");

  const baseSection = (title: string, description: string, confidence: StrategySection["confidence"] = "medium"): StrategySection => ({
    title,
    description,
    confidence,
    supportingEvidence: [],
    reasoningReferences: [],
  });

  return {
    version: STRATEGY_GRAPH_VERSION,
    organizationId: companySnapshot.organizationId,
    campaignId: campaignContext.projectId,
    createdAt,
    businessSummary: baseSection(nl ? "Bedrijfssamenvatting" : "Business summary", companyName),
    strategicPositioning: baseSection(nl ? "Strategische positionering" : "Strategic positioning", positioning),
    valueProposition: baseSection(
      nl ? "Waardepropositie" : "Value proposition",
      legacyFinding(sources.legacy, "brand_understanding", "brand-value-prop") ?? positioning
    ),
    primaryAudience: baseSection(nl ? "Primaire doelgroep" : "Primary audience", audience, audience.includes("unknown") || audience.includes("onbekend") ? "low" : "medium"),
    customerProblems: baseSection(
      nl ? "Klantproblemen" : "Customer problems",
      campaignContext.extraContext.trim() || (nl ? "Nog te verduidelijken" : "To be clarified"),
      "low"
    ),
    customerMotivations: baseSection(nl ? "Klantmotivaties" : "Customer motivations", nl ? "Nog te bevestigen" : "Still to be confirmed", "low"),
    buyingTriggers: baseSection(nl ? "Aankooptriggers" : "Buying triggers", goals[0] ?? campaignContext.description),
    objections: baseSection(nl ? "Bezwaren" : "Objections", nl ? "Geen bevestigde bezwaren" : "No confirmed objections", "low"),
    differentiators: baseSection(
      nl ? "Differentiators" : "Differentiators",
      profile.uniqueSellingPoints.value?.join(" · ") ?? (nl ? "Nog onbekend" : "Still unknown"),
      "low"
    ),
    strategicThemes: [],
    priorityOpportunities: [],
    strategicRisks: [
      baseSection(
        nl ? "Context-risico" : "Context risk",
        nl ? "Onvolledige merk- of concurrentcontext" : "Incomplete brand or competitor context",
        "medium"
      ),
    ],
    constraints: [],
    assumptions: [
      baseSection(
        nl ? "Campagne-aannames" : "Campaign assumptions",
        nl ? "Doelgroep en doel sluiten aan op ingevulde campagne" : "Audience and goal match supplied campaign input"
      ),
    ],
    unknowns: [
      baseSection(
        nl ? "Onbekenden" : "Unknowns",
        [
          !sources.legacy.website_understanding?.findings.length ? (nl ? "website" : "website") : null,
          !sources.legacy.competitor_understanding?.findings.length ? (nl ? "concurrenten" : "competitors") : null,
        ]
          .filter(Boolean)
          .join(", ") || (nl ? "Geen" : "None"),
        "low"
      ),
    ],
    evidenceSummary: baseSection(nl ? "Evidence-samenvatting" : "Evidence summary", nl ? "Legacy upstream outputs" : "Legacy upstream outputs", "low"),
    rejectedAlternatives: [],
    decisionRationales: [],
    recommendedDirection: baseSection(
      nl ? "Aanbevolen richting" : "Recommended direction",
      nl
        ? "Strategie gebaseerd op bevestigde campagne-input en beschikbare bedrijfscontext."
        : "Strategy based on confirmed campaign input and available company context."
    ),
    successCriteria: baseSection(
      nl ? "Succescriteria" : "Success criteria",
      nl ? "Planningaannname: engagement, clicks, conversies (geen numerieke belofte)" : "Planning assumption: engagement, clicks, conversions (no numeric promise)"
    ),
  };
}

export function strategyGraphFromBrainOutput(
  output: BrainStructuredOutput,
  input: { organizationId: string; campaignId?: string }
): StrategyGraph | null {
  if (output.capabilityId !== "strategy") return null;
  const finding = (label: string) =>
    output.findings.find((f) => f.label.toLowerCase() === label.toLowerCase());
  const toSection = (title: string, label: string): StrategySection => {
    const match = finding(label);
    return {
      title,
      description: match?.value ?? "",
      confidence: match?.confidence ?? "medium",
      supportingEvidence: match?.provenance.map((p) => p.refId) ?? [],
      reasoningReferences: [],
    };
  };

  function parseRejectedAlternatives(rationale: string): RejectedAlternative[] {
    const match = rationale.match(/(?:Rejected alternatives:|Afgewezen alternatieven:)\s*(.+)/i);
    if (!match?.[1]) return [];
    return match[1]
      .split(";")
      .flatMap((part) => {
        const trimmed = part.trim();
        const altMatch = trimmed.match(/^(.+?)\s*\((.+)\)$/);
        if (altMatch) {
          return [
            {
              alternative: altMatch[1].trim(),
              reason: altMatch[2].trim(),
              confidence: "medium" as const,
            },
          ];
        }
        return trimmed
          ? [{ alternative: trimmed, reason: "Rejected without documented reason.", confidence: "medium" as const }]
          : [];
      });
  }

  const primaryDecision = output.decisions[0];
  const rejectedAlternatives = primaryDecision
    ? parseRejectedAlternatives(primaryDecision.rationale)
    : [];

  const risksSection = toSection("Risk", "Risks");
  const unknownsSection = toSection("Unknown", "Unknowns");
  const assumptionsSection = toSection("Assumption", "Assumptions");

  const strategicRisks =
    risksSection.description.trim() && !/^none$|^geen$/i.test(risksSection.description.trim())
      ? [risksSection]
      : [];

  const unknowns =
    unknownsSection.description.trim() && !/^none$|^geen$/i.test(unknownsSection.description.trim())
      ? [unknownsSection]
      : [];

  const assumptions =
    assumptionsSection.description.trim() ? [assumptionsSection] : [];

  const decisionRationales: StrategyDecisionRecord[] = primaryDecision
    ? [
        {
          decision: primaryDecision.label,
          reason: primaryDecision.rationale,
          evidence: primaryDecision.provenance.map((p) => p.refId),
          alternativesConsidered: rejectedAlternatives.map((a) => a.alternative),
          alternativesRejected: rejectedAlternatives,
          confidence: primaryDecision.confidence,
          risks: strategicRisks.map((r) => r.title),
          unknowns: unknowns.map((u) => u.title),
        },
      ]
    : [];

  return {
    version: STRATEGY_GRAPH_VERSION,
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    createdAt: output.generatedAt,
    businessSummary: toSection("Business summary", "Business objective"),
    strategicPositioning: toSection("Strategic positioning", "Positioning"),
    valueProposition: toSection("Value proposition", "Value proposition"),
    primaryAudience: toSection("Primary audience", "Target audience"),
    customerProblems: toSection("Customer problems", "Audience problem"),
    customerMotivations: toSection("Customer motivations", "Audience problem"),
    buyingTriggers: toSection("Buying triggers", "Desired outcome"),
    objections: toSection("Objections", "Unknowns"),
    differentiators: toSection("Differentiators", "Supporting messages"),
    strategicThemes: [],
    priorityOpportunities: [],
    strategicRisks,
    constraints: [],
    assumptions,
    unknowns,
    evidenceSummary: toSection("Evidence", "Business objective"),
    rejectedAlternatives,
    decisionRationales,
    recommendedDirection: toSection("Recommended direction", "Campaign concept"),
    successCriteria: toSection("Success criteria", "KPI framework"),
  };
}
