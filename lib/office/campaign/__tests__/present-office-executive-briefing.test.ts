import { describe, expect, it } from "vitest";
import { presentOfficeExecutiveBriefingSummary } from "@/lib/office/campaign/present-office-executive-briefing";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { PlanningGraph } from "@/lib/brain/layers/planning/types";

function sampleBriefing(overrides: Partial<ExecutiveCampaignBriefing> = {}): ExecutiveCampaignBriefing {
  const graph = {
    version: "1.0.0",
    organizationId: "org",
    createdAt: "2026-08-01T10:00:00.000Z",
    objectives: [],
    milestones: [],
    planningDecisions: [],
    executionStages: [
      {
        id: "s1",
        title: "Propositie aanscherpen",
        description: "Landing page",
        businessPurpose: "Heldere propositie voor bezoekers",
        reason: "",
        priority: "high",
        ownerBrain: "marketing",
        dependsOn: [],
        blocks: [],
        estimatedEffort: "1 week",
        requiredInputs: [],
        producedOutputs: [],
        approvalRequired: false,
        status: "ready",
        confidence: "high",
      },
    ],
    executionOrder: ["s1"],
    dependencies: [],
    blockedActivities: [],
    parallelActivities: [],
    criticalPath: [],
    requiredAssets: [],
    requiredKnowledge: [],
    requiredCustomerInput: [
      {
        id: "c1",
        title: "Advertentiebudget bevestigen",
        category: "budget",
        reason: "Emma heeft een budget nodig om kanalen te activeren.",
        blocksNodeIds: ["s1"],
        status: "missing",
      },
    ],
    requiredIntegrations: [],
    reviewMoments: [],
    successCriteria: [],
    readiness: {
      level: "mostly_ready",
      score: 80,
      summary: "Mostly ready",
      blockers: [],
      waitingFor: [],
      checks: [],
    },
    risks: [
      {
        id: "r1",
        title: "Prijspositionering nog niet bevestigd",
        description: "",
        probability: "medium",
        impact: "medium",
        mitigation: "Review met klant",
        fallback: "",
        reviewTrigger: "",
        linkedNodeIds: [],
      },
    ],
    unknowns: [],
    estimatedTimeline: [
      {
        id: "t1",
        phase: "Propositie en landingspagina aanscherpen",
        intent: "Conversiepad voorbereiden",
        nodeIds: ["s1"],
        requiresCustomerInput: true,
        happensAfterLaunch: false,
      },
    ],
    dependencyAnalysis: {
      dependencies: [],
      criticalPath: [],
      parallelOpportunities: [],
      missingDependencies: [],
      circularDependencies: [],
      unnecessaryDependencies: [],
    },
  } satisfies PlanningGraph;

  return {
    title: "Executive review — Demo",
    preparedAt: "2026-08-01T10:00:00.000Z",
    companyName: "Demo Co",
    sections: [
      { id: "executive-summary", title: "Summary", summary: "Summary text" },
      { id: "business-impact", title: "Impact", summary: "Meetbare groei in demo-aanvragen." },
      { id: "customer-needs", title: "Needs", summary: "Budget nodig" },
      { id: "risks-and-unknowns", title: "Risks", summary: "Prijspositionering" },
    ],
    topDecisions: [
      {
        id: "d1",
        title: "Focus op vastgoedeigenaren",
        summary: "B2B vastgoed",
        recommendation: "Focus de campagne op zakelijke vastgoedeigenaren.",
        confidence: "Hoog",
        confidenceLevel: "high",
        businessImpact: "Snellere pipeline-opbouw",
        approvalRequired: true,
        category: "strategy_direction",
      },
    ],
    decisions: [
      {
        id: "d1",
        title: "Focus op vastgoedeigenaren",
        summary: "B2B vastgoed",
        recommendation: "Focus de campagne op zakelijke vastgoedeigenaren.",
        confidence: "high",
        confidenceScore: 0.9,
        businessImpact: "Snellere pipeline-opbouw",
        expectedOutcome: "Meer gekwalificeerde leads",
        reasoning: "Dit segment heeft de hoogste intentie in Q3.",
        supportingEvidence: [],
        assumptions: [],
        knownRisks: [],
        unknowns: [],
        alternativesConsidered: [],
        alternativesRejected: [
          { alternative: "Breed consumentenpubliek", reason: "Te weinig koopintentie" },
        ],
        dependencies: [],
        reviewTriggers: [],
        customerChallenges: [],
        approvalRequired: true,
        category: "strategy_direction",
        createdAt: "2026-08-01T10:00:00.000Z",
        brainVersion: "1.0.0",
      },
    ],
    recommendationSummary: "Focus op vastgoedeigenaren.",
    requiredDecisions: [],
    executionPlan: {
      whatEmmaIntends: "Leads genereren",
      recommendedOrder: "Stap 1: Propositie\nStap 2: Kanalen",
      whyThisOrder: "Eerst propositie",
      parallelOpportunities: "",
      whatEmmaNeeds: "Budget",
      readiness: "Grotendeels klaar",
      mainRisks: "Prijspositionering",
      reviewMoments: "",
      expectedNextStep: "Na akkoord start Emma met fase 1.",
    },
    planningGraph: graph,
    ...overrides,
  };
}

describe("presentOfficeExecutiveBriefingSummary", () => {
  it("builds a single management summary view model", () => {
    const vm = presentOfficeExecutiveBriefingSummary({
      briefing: sampleBriefing(),
      locale: "nl",
      pendingApproval: true,
      publicationUnlocked: false,
    });

    expect(vm.headerTitle).toContain("Emma");
    expect(vm.primaryAdvice?.recommendation).toContain("vastgoedeigenaren");
    expect(vm.executionPhases.length).toBeGreaterThan(0);
    expect(vm.customerNeeds).toHaveLength(1);
    expect(vm.risks.length).toBeGreaterThan(0);
    expect(vm.statusKind).toBe("pending_approval");
  });

  it("marks approved campaigns without pending status", () => {
    const vm = presentOfficeExecutiveBriefingSummary({
      briefing: sampleBriefing(),
      locale: "nl",
      pendingApproval: false,
      publicationUnlocked: true,
    });
    expect(vm.statusKind).toBe("approved");
  });

  it("handles empty customer needs calmly", () => {
    const briefing = sampleBriefing({
      planningGraph: {
        ...sampleBriefing().planningGraph!,
        requiredCustomerInput: [],
      },
    });
    const vm = presentOfficeExecutiveBriefingSummary({
      briefing,
      locale: "nl",
      pendingApproval: false,
      publicationUnlocked: true,
    });
    expect(vm.customerNeedsEmpty).toBe(true);
  });
});
