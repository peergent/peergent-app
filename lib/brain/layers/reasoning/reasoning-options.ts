/**
 * Reasoning Brain — structured decision options (not decisions).
 */

import type { ReasoningBrainGraph, ReasoningDecisionOption } from "./brain-types";

let optionCounter = 0;

export function resetReasoningOptionCounter(): void {
  optionCounter = 0;
}

export function buildDecisionOptions(input: {
  graph: Pick<
    ReasoningBrainGraph,
    "interpretations" | "opportunities" | "contradictions" | "unknowns"
  >;
  createdAt: string;
}): ReasoningDecisionOption[] {
  const options: ReasoningDecisionOption[] = [];

  const channelInterpretation = input.graph.interpretations.find((i) =>
    /linkedin|channel|underutilized/i.test(i.title)
  );

  if (channelInterpretation) {
    optionCounter += 1;
    options.push({
      id: `opt-${optionCounter}`,
      label: "Option A — Deepen LinkedIn understanding",
      description: "Investigate LinkedIn competitor activity and audience fit before any channel commitment.",
      advantages: ["Evidence-based channel decision", "Lower risk of misallocated effort"],
      disadvantages: ["Requires additional research cycle", "Delays channel action"],
      confidence: channelInterpretation.confidence,
      requiredEffort: "medium",
      expectedOutcome: "Clearer picture of LinkedIn opportunity vs. saturation.",
      dependencies: ["Additional channel research"],
      createdAt: input.createdAt,
    });

    optionCounter += 1;
    options.push({
      id: `opt-${optionCounter}`,
      label: "Option B — Focus on existing channels",
      description: "Prioritize channels already aligned with company posture and confirmed audience behavior.",
      advantages: ["Aligns with known company constraints", "Lower operational complexity"],
      disadvantages: ["May miss competitor-dominated channels", "Potential reach gap"],
      confidence: "medium",
      requiredEffort: "low",
      expectedOutcome: "Consolidated presence on confirmed channels.",
      dependencies: ["Validated channel performance data"],
      createdAt: input.createdAt,
    });

    optionCounter += 1;
    options.push({
      id: `opt-${optionCounter}`,
      label: "Option C — Parallel channel test hypothesis",
      description: "Treat LinkedIn as a testable hypothesis requiring validation before scale.",
      advantages: ["Balances exploration with caution", "Generates learning signal"],
      disadvantages: ["Split focus", "Uncertain ROI until validated"],
      confidence: "low",
      requiredEffort: "high",
      expectedOutcome: "Structured learning about channel viability.",
      dependencies: ["Measurement framework", "Validation Brain review"],
      createdAt: input.createdAt,
    });
  }

  if (options.length === 0 && input.graph.opportunities.length > 0) {
    const opp = input.graph.opportunities[0]!;
    optionCounter += 1;
    options.push({
      id: `opt-${optionCounter}`,
      label: "Option A — Validate opportunity first",
      description: `Gather confirming evidence for: ${opp.description.slice(0, 100)}`,
      advantages: ["Reduces false-positive strategy bets"],
      disadvantages: ["Slower time to action"],
      confidence: opp.confidence,
      requiredEffort: "medium",
      expectedOutcome: "Higher-confidence understanding of the opportunity.",
      dependencies: ["Research Brain follow-up"],
      createdAt: input.createdAt,
    });

    optionCounter += 1;
    options.push({
      id: `opt-${optionCounter}`,
      label: "Option B — Monitor without action",
      description: "Track signals without committing resources until confidence increases.",
      advantages: ["Minimal resource use", "Avoids premature commitment"],
      disadvantages: ["Competitors may move faster"],
      confidence: "low",
      requiredEffort: "low",
      expectedOutcome: "Continued situational awareness.",
      dependencies: [],
      createdAt: input.createdAt,
    });
  }

  if (options.length === 0 && input.graph.unknowns.length > 0) {
    optionCounter += 1;
    options.push({
      id: `opt-${optionCounter}`,
      label: "Option A — Prioritize unknown resolution",
      description: "Focus next cycle on resolving critical unknowns before strategic choices.",
      advantages: ["Reduces decision risk"],
      disadvantages: ["Delays downstream planning"],
      confidence: "medium",
      requiredEffort: "medium",
      expectedOutcome: "Clearer foundation for Strategy Brain.",
      dependencies: ["Research Brain"],
      createdAt: input.createdAt,
    });
  }

  return options;
}

/** Guard — options must not contain strategy imperatives. */
export function containsStrategyImperative(text: string): boolean {
  return /\b(we must|we should launch|execute immediately|start ads)\b/i.test(text);
}
