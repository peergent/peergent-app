import type {
  LearningContradiction,
  LearningHypothesis,
  LearningPattern,
  LearningUnknown,
  LearningConfidence,
} from "./brain-types";

export function detectContradictions(input: {
  hypotheses: readonly LearningHypothesis[];
  patterns: readonly LearningPattern[];
}): LearningContradiction[] {
  const contradictions: LearningContradiction[] = [];
  const proofLed = input.hypotheses.filter((h) => h.statement.toLowerCase().includes("proof"));
  const urgencyLed = input.hypotheses.filter((h) => h.statement.toLowerCase().includes("urgency"));

  if (proofLed.length > 0 && urgencyLed.length > 0) {
    contradictions.push({
      id: "con-1",
      claimA: proofLed[0]!.statement,
      claimB: urgencyLed[0]!.statement,
      scopeA: proofLed[0]!.scope,
      scopeB: urgencyLed[0]!.scope,
      evidenceA: proofLed[0]!.supportingEvidence,
      evidenceB: urgencyLed[0]!.supportingEvidence,
      possibleExplanation: "Context-specific audience or channel behavior",
      resolutionStatus: "unresolved",
      confidence: "low",
    });
  }

  for (const pattern of input.patterns) {
    if (pattern.contradictions.length > 0) {
      contradictions.push({
        id: `con-${pattern.id}`,
        claimA: pattern.title,
        claimB: pattern.contradictions.join("; "),
        scopeA: pattern.scope,
        scopeB: "alternate context",
        evidenceA: pattern.supportingObservations,
        evidenceB: pattern.contradictions,
        possibleExplanation: "May reveal context-specific behavior",
        resolutionStatus: "needs_more_data",
        confidence: "low",
      });
    }
  }

  return contradictions;
}

export function buildUnknowns(input: {
  observationCount: number;
  hasBaseline: boolean;
  attributionWeak: boolean;
  durationDays: number | null;
  executionInterrupted: boolean;
}): LearningUnknown[] {
  const unknowns: LearningUnknown[] = [];
  if (input.observationCount < 3) {
    unknowns.push({
      id: "unk-sample",
      question: "Is sample size sufficient for learning?",
      whyUnknown: "Insufficient observations",
      requiredEvidence: ["Additional comparable observations"],
      blockingForLearning: true,
      recommendedNextMeasurement: "Extend measurement window",
    });
  }
  if (!input.hasBaseline) {
    unknowns.push({
      id: "unk-baseline",
      question: "What is the comparable baseline?",
      whyUnknown: "No comparable baseline provided",
      requiredEvidence: ["Baseline metric for comparison"],
      blockingForLearning: false,
      recommendedNextMeasurement: "Establish baseline in next episode",
    });
  }
  if (input.attributionWeak) {
    unknowns.push({
      id: "unk-attribution",
      question: "How much credit belongs to each channel?",
      whyUnknown: "Weak attribution confidence",
      requiredEvidence: ["Improved attribution model or experiment"],
      blockingForLearning: false,
      recommendedNextMeasurement: "Improve tracking completeness",
    });
  }
  if (input.durationDays != null && input.durationDays < 7) {
    unknowns.push({
      id: "unk-duration",
      question: "Is the campaign duration long enough?",
      whyUnknown: "Short measurement duration",
      requiredEvidence: ["Longer observation window"],
      blockingForLearning: false,
      recommendedNextMeasurement: "Re-run learning after 30 days",
    });
  }
  if (input.executionInterrupted) {
    unknowns.push({
      id: "unk-execution",
      question: "How did execution interruption affect outcomes?",
      whyUnknown: "Execution interrupted during window",
      requiredEvidence: ["Clean execution window"],
      blockingForLearning: true,
      recommendedNextMeasurement: "Retry after successful execution",
    });
  }
  return unknowns;
}

export function mergeIncrementalHypotheses(
  prior: readonly LearningHypothesis[],
  current: readonly LearningHypothesis[]
): LearningHypothesis[] {
  const map = new Map(prior.map((h) => [h.statement, h]));
  for (const h of current) {
    const existing = map.get(h.statement);
    if (existing && h.status === "supported") {
      map.set(h.statement, { ...existing, status: "supported", confidence: h.confidence });
    } else if (!existing) {
      map.set(h.statement, h);
    }
  }
  return [...map.values()];
}
