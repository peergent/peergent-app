import type {
  AssessmentFinding,
  ChapterConfidence,
  EvidenceCategory,
  QualitativeConfidence,
  WebsiteIntelligenceAssessment,
  WorkforceRecommendation,
} from "./types";
import { collectAllFindings } from "./demo-assessment";

export type ModelZoneId =
  | "overview"
  | "business-model"
  | "growth"
  | "execution"
  | "workforce";

export type SignalState = "strong" | "opportunity" | "needs-data" | "unknown";

export type InsightObject = {
  id: string;
  title: string;
  category: EvidenceCategory;
  statement: string;
  evidence?: string;
  enrichmentHint?: string;
};

export type GapChip = {
  id: string;
  label: string;
  href?: string;
};

export type SignalStripItem = {
  id: string;
  label: string;
  state: SignalState;
  strength: 1 | 2 | 3;
};

export type DeployTier = "primary" | "next" | "later";

export type PeerViewModel = {
  employee: WorkforceRecommendation;
  deployLabel: string;
  tier: DeployTier;
  whyNow: string;
};

export type ZoneReasoning = {
  confidenceLabel: string;
  confidenceReason: string;
  findings: AssessmentFinding[];
};

export type AssessmentViewModel = {
  meta: WebsiteIntelligenceAssessment["meta"];
  confidence: WebsiteIntelligenceAssessment["confidenceSnapshot"];
  overview: {
    opportunityHeadline: string;
    opportunityAccent: string;
    signalChips: InsightObject[];
    gapChips: GapChip[];
    primaryPeer: PeerViewModel;
  };
  signalStrip: SignalStripItem[];
  businessModel: {
    pills: { label: string; value: string }[];
    insights: InsightObject[];
    reasoning: ZoneReasoning;
  };
  growth: {
    segments: { label: string; count: number; tone: "observed" | "likely" | "unknown" }[];
    journeyFrictionNode: string;
    insights: InsightObject[];
    reasoning: ZoneReasoning;
  };
  execution: {
    areas: { id: string; name: string; state: SignalState }[];
    topInsight: InsightObject | null;
    insights: InsightObject[];
    reasoning: ZoneReasoning;
  };
  workforce: {
    peers: PeerViewModel[];
  };
  decision: {
    peerName: string;
    whyChips: string[];
    connectChips: GapChip[];
  };
};

export function clampWords(text: string, maxWords: number): string {
  const words = text
    .replace(/[.,—–;:!?()[\]]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

function findingToInsight(finding: AssessmentFinding, titleWords = 4): InsightObject {
  return {
    id: finding.id,
    title: clampWords(finding.statement, titleWords),
    category: finding.category,
    statement: finding.statement,
    evidence: finding.evidence,
    enrichmentHint: finding.enrichmentHint,
  };
}

function deriveSignalState(
  confidence: ChapterConfidence,
  findings: AssessmentFinding[]
): { state: SignalState; strength: 1 | 2 | 3 } {
  const hasObserved = findings.some((f) => f.category === "observed");
  const hasNeedsData = findings.some((f) => f.category === "requires-more-data");
  const mostlyUnknown =
    findings.filter((f) => f.category === "unknown").length >
    findings.length / 2;

  if (hasObserved && confidence.level !== "low") {
    return { state: "strong", strength: 3 };
  }
  if (hasNeedsData || confidence.level === "low") {
    return {
      state: mostlyUnknown ? "unknown" : "needs-data",
      strength: 1,
    };
  }
  if (confidence.level === "moderate") {
    return { state: "opportunity", strength: 2 };
  }
  return { state: "opportunity", strength: 2 };
}

function peerTier(index: number): {
  tier: DeployTier;
  deployLabel: string;
} {
  if (index === 0) return { tier: "primary", deployLabel: "Highest leverage" };
  if (index === 1) return { tier: "next", deployLabel: "Next" };
  return { tier: "later", deployLabel: "Later" };
}

function uniqueFindings(
  findings: AssessmentFinding[],
  seen: Set<string>,
  limit: number
): AssessmentFinding[] {
  const result: AssessmentFinding[] = [];
  for (const f of findings) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    result.push(f);
    if (result.length >= limit) break;
  }
  return result;
}

function collectGapChips(assessment: WebsiteIntelligenceAssessment): GapChip[] {
  const slots = [
    ...assessment.marketingGrowth.enrichmentSlots,
    ...assessment.operations.enrichmentSlots,
  ];
  const seen = new Set<string>();
  const chips: GapChip[] = [];

  for (const slot of slots) {
    if (seen.has(slot.source)) continue;
    seen.add(slot.source);
    chips.push({
      id: slot.source,
      label: clampWords(slot.label, 2),
      href: slot.href,
    });
    if (chips.length >= 3) break;
  }

  return chips;
}

function confidenceWord(level: QualitativeConfidence): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function buildAssessmentViewModel(
  assessment: WebsiteIntelligenceAssessment
): AssessmentViewModel {
  const seen = new Set<string>();
  const allFindings = collectAllFindings(assessment);

  const observed = uniqueFindings(
    allFindings.filter((f) => f.category === "observed"),
    seen,
    1
  );
  const likely = uniqueFindings(
    allFindings.filter((f) => f.category === "likely"),
    seen,
    1
  );
  const opportunity = uniqueFindings(
    [
      ...assessment.customerJourney.opportunities,
      ...assessment.customerJourney.frictionPoints,
    ],
    seen,
    1
  );

  const signalChips = [...observed, ...likely, ...opportunity]
    .slice(0, 3)
    .map((f) => findingToInsight(f, 3));

  const primaryRec = assessment.workforceRecommendations.recommendations[0];
  const primaryPeer: PeerViewModel = {
    employee: primaryRec,
    ...peerTier(0),
    whyNow: clampWords(primaryRec.whyRecommended, 8),
  };

  const peers: PeerViewModel[] = assessment.workforceRecommendations.recommendations.map(
    (employee, index) => ({
      employee,
      ...peerTier(index),
      whyNow: clampWords(employee.whyRecommended, 8),
    })
  );

  const companyFindings = uniqueFindings(assessment.companyDna.findings, new Set(), 3);
  const growthFindings = uniqueFindings(
    [
      ...assessment.marketingGrowth.observed,
      ...assessment.marketingGrowth.likely,
      ...assessment.marketingGrowth.unknown,
      ...assessment.customerJourney.opportunities,
    ],
    new Set(seen),
    3
  );
  const executionFindings = uniqueFindings(
    assessment.operations.areas.flatMap((a) => a.findings),
    new Set(seen),
    3
  );

  const companySignal = deriveSignalState(
    assessment.companyDna.confidence,
    assessment.companyDna.findings
  );
  const journeySignal = deriveSignalState(
    assessment.customerJourney.confidence,
    [
      ...assessment.customerJourney.frictionPoints,
      ...assessment.customerJourney.opportunities,
    ]
  );
  const marketingSignal = deriveSignalState(
    assessment.marketingGrowth.confidence,
    [
      ...assessment.marketingGrowth.observed,
      ...assessment.marketingGrowth.likely,
      ...assessment.marketingGrowth.unknown,
    ]
  );
  const opsSignal = deriveSignalState(
    assessment.operations.confidence,
    assessment.operations.areas.flatMap((a) => a.findings)
  );
  const workforceSignal = deriveSignalState(
    assessment.workforceRecommendations.confidence,
    assessment.workforceRecommendations.recommendations.flatMap(
      (r) => r.supportingFindings
    )
  );

  return {
    meta: assessment.meta,
    confidence: assessment.confidenceSnapshot,
    overview: {
      opportunityHeadline: clampWords(assessment.executiveSummary.conclusion, 6),
      opportunityAccent: clampWords(
        assessment.customerJourney.opportunities[0]?.statement ??
          assessment.executiveSummary.rationale,
        4
      ),
      signalChips,
      gapChips: collectGapChips(assessment),
      primaryPeer,
    },
    signalStrip: [
      { id: "company", label: "Model", ...companySignal },
      { id: "journey", label: "Journey", ...journeySignal },
      { id: "marketing", label: "Growth", ...marketingSignal },
      { id: "ops", label: "Execution", ...opsSignal },
      { id: "workforce", label: "AI hire", ...workforceSignal },
    ],
    businessModel: {
      pills: [
        { label: "Type", value: clampWords(assessment.companyDna.businessType, 3) },
        {
          label: "Buyer",
          value: clampWords(assessment.companyDna.targetCustomers, 3),
        },
        {
          label: "Brand",
          value: clampWords(assessment.companyDna.brandPresentation, 3),
        },
      ],
      insights: companyFindings.map((f) => findingToInsight(f)),
      reasoning: {
        confidenceLabel: confidenceWord(assessment.companyDna.confidence.level),
        confidenceReason: assessment.companyDna.confidence.reason,
        findings: assessment.companyDna.findings,
      },
    },
    growth: {
      segments: [
        {
          label: "Seen",
          count: assessment.marketingGrowth.observed.length,
          tone: "observed",
        },
        {
          label: "Likely",
          count: assessment.marketingGrowth.likely.length,
          tone: "likely",
        },
        {
          label: "Unknown",
          count: assessment.marketingGrowth.unknown.length,
          tone: "unknown",
        },
      ],
      journeyFrictionNode: clampWords(
        assessment.customerJourney.frictionPoints[0]?.statement ?? "Evaluate",
        2
      ),
      insights: growthFindings.map((f) => findingToInsight(f)),
      reasoning: {
        confidenceLabel: confidenceWord(assessment.marketingGrowth.confidence.level),
        confidenceReason: assessment.marketingGrowth.confidence.reason,
        findings: [
          ...assessment.marketingGrowth.observed,
          ...assessment.marketingGrowth.likely,
          ...assessment.marketingGrowth.unknown,
          ...assessment.customerJourney.frictionPoints,
          ...assessment.customerJourney.opportunities,
        ],
      },
    },
    execution: {
      areas: assessment.operations.areas.slice(0, 4).map((area) => {
        const signal = deriveSignalState(
          assessment.operations.confidence,
          area.findings
        );
        return { id: area.id, name: area.name, state: signal.state };
      }),
      topInsight: executionFindings[0]
        ? findingToInsight(executionFindings[0])
        : null,
      insights: executionFindings.map((f) => findingToInsight(f)),
      reasoning: {
        confidenceLabel: confidenceWord(assessment.operations.confidence.level),
        confidenceReason: assessment.operations.confidence.reason,
        findings: assessment.operations.areas.flatMap((a) => a.findings),
      },
    },
    workforce: { peers },
    decision: {
      peerName: primaryRec.name,
      whyChips: primaryRec.supportingFindings
        .slice(0, 3)
        .map((f) => clampWords(f.statement, 3)),
      connectChips: collectGapChips(assessment).slice(0, 2),
    },
  };
}
