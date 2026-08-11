/**
 * Reasoning Brain — prioritization signals.
 */

import type {
  ReasoningBrainOpportunity,
  ReasoningBrainRisk,
  ReasoningInterpretation,
  ReasoningPriority,
  ReasoningPrioritySignal,
  ReasoningImportance,
} from "./brain-types";

let signalCounter = 0;

export function resetReasoningPrioritizationCounter(): void {
  signalCounter = 0;
}

function scorePriority(input: {
  businessImpact: ReasoningImportance;
  confidence: "low" | "medium" | "high";
  urgency: ReasoningPriority;
  effort: ReasoningPriority;
  risk: ReasoningPriority;
}): ReasoningPriority {
  let score = 0;
  if (input.businessImpact === "critical") score += 3;
  else if (input.businessImpact === "high") score += 2;
  else if (input.businessImpact === "medium") score += 1;

  if (input.confidence === "high") score += 2;
  else if (input.confidence === "medium") score += 1;

  if (input.urgency === "high") score += 2;
  else if (input.urgency === "medium") score += 1;

  if (input.effort === "low") score += 1;
  if (input.risk === "high") score -= 1;

  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export function buildPrioritySignals(input: {
  interpretations: readonly ReasoningInterpretation[];
  opportunities: readonly ReasoningBrainOpportunity[];
  risks: readonly ReasoningBrainRisk[];
  createdAt: string;
}): ReasoningPrioritySignal[] {
  const signals: ReasoningPrioritySignal[] = [];

  for (const interpretation of input.interpretations) {
    signalCounter += 1;
    const urgency: ReasoningPriority =
      interpretation.importance === "critical" || interpretation.importance === "high"
        ? "high"
        : "medium";
    const priority = scorePriority({
      businessImpact: interpretation.importance,
      confidence: interpretation.confidence,
      urgency,
      effort: "medium",
      risk: "medium",
    });

    signals.push({
      id: `pri-${signalCounter}`,
      subject: interpretation.title,
      priority,
      rationale: interpretation.summary,
      businessImpact: interpretation.importance,
      confidence: interpretation.confidence,
      urgency,
      effort: "medium",
      risk: "medium",
      relatedInterpretationId: interpretation.id,
      createdAt: input.createdAt,
    });
  }

  for (const opp of input.opportunities.slice(0, 3)) {
    signalCounter += 1;
    signals.push({
      id: `pri-${signalCounter}`,
      subject: opp.description.slice(0, 80),
      priority: opp.priority,
      rationale: opp.reason,
      businessImpact: "medium",
      confidence: opp.confidence,
      urgency: opp.priority,
      effort: opp.requiredEffort,
      risk: "low",
      relatedInterpretationId: null,
      createdAt: input.createdAt,
    });
  }

  return signals.sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return order[b.priority] - order[a.priority];
  });
}

export function prioritizeOpportunity(confidence: "low" | "medium" | "high"): ReasoningPriority {
  if (confidence === "high") return "high";
  if (confidence === "medium") return "medium";
  return "low";
}
