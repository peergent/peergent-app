import { describe, expect, it } from "vitest";

import { assembleCampaign } from "@/lib/campaign";
import type { CampaignSource } from "@/lib/campaign/campaign-source";

import {
  CampaignPlannerDependencyError,
  CampaignPlannerInvalidSourceError,
  deriveCampaignExecutionOrder,
  planCampaignExecution,
  validateCampaignWorkPackageDependencies,
} from "../plan-campaign-execution";
import type { CampaignPlannerSource, CampaignWorkPackage } from "../types";

const assembledAt = "2026-07-20T12:00:00.000Z";

function buildSource(
  overrides: Partial<CampaignPlannerSource> = {},
  campaignOverrides: Partial<CampaignSource> = {}
): CampaignPlannerSource {
  const campaign = assembleCampaign({
    organizationId: "org-1",
    campaignId: "camp-1",
    name: "Test campaign",
    assembledAt,
    approvalMode: "approval_before_publication",
    ...campaignOverrides,
  });
  return {
    organizationId: "org-1",
    peerId: "peer-1",
    campaign,
    assembledAt,
    ...overrides,
  };
}

describe("planCampaignExecution", () => {
  it("wizard-only campaign produces planning work without invented channel content packages", () => {
    const plan = planCampaignExecution(buildSource());
    const content = plan.workPackages.filter((p) => p.type === "content_creation");
    expect(content).toHaveLength(0);
    expect(plan.gaps.some((g) => g.id === "gap-channels-deliverables")).toBe(true);
    expect(plan.status).toBe("draft");
    const channels = content.map((p) => p.channel).filter(Boolean);
    expect(channels).not.toContain("LinkedIn");
    expect(channels).not.toContain("Meta");
  });

  it("explicit channels and deliverables produce content packages", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitChannels: ["LinkedIn"],
        explicitDeliverables: [
          { channel: "Email", deliverableType: "newsletter", title: "Launch newsletter" },
        ],
      })
    );
    const content = plan.workPackages.filter((p) => p.type === "content_creation");
    expect(content.length).toBeGreaterThanOrEqual(2);
    expect(content.some((p) => p.channel === "LinkedIn")).toBe(true);
    expect(content.some((p) => p.deliverableType === "newsletter")).toBe(true);
    expect(plan.workPackages.some((p) => p.type === "review")).toBe(true);
  });

  it("does not add generic channel placeholder when a concrete deliverable exists for that channel", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitChannels: ["LinkedIn", "Email"],
        explicitDeliverables: [
          { channel: "LinkedIn", deliverableType: "social_post", title: "Social post — LinkedIn" },
          { channel: "Email", deliverableType: "email", title: "Email — Email" },
        ],
      })
    );
    const content = plan.workPackages.filter((p) => p.type === "content_creation");
    expect(content.filter((p) => p.deliverableType === "generic")).toHaveLength(0);
    expect(content).toHaveLength(2);
    expect(content.some((p) => p.channel === "LinkedIn" && p.deliverableType === "social_post")).toBe(
      true
    );
    expect(content.some((p) => p.channel === "Email" && p.deliverableType === "email")).toBe(true);
  });

  it("keeps generic channel placeholder when no concrete deliverable exists for that channel", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitChannels: ["LinkedIn"],
        explicitDeliverables: [
          { channel: "Email", deliverableType: "email", title: "Email — Email" },
        ],
      })
    );
    const content = plan.workPackages.filter((p) => p.type === "content_creation");
    expect(content.some((p) => p.channel === "LinkedIn" && p.deliverableType === "generic")).toBe(
      true
    );
    expect(content.some((p) => p.channel === "Email" && p.deliverableType === "email")).toBe(true);
    expect(content.filter((p) => p.deliverableType === "generic")).toHaveLength(1);
  });

  it("includes campaign concept once without per-channel generic duplicates", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitChannels: ["LinkedIn", "Email"],
        explicitDeliverables: [
          { channel: "Campaign", deliverableType: "campaign_concept", title: "Campaign concept" },
          { channel: "LinkedIn", deliverableType: "social_post", title: "Social post — LinkedIn" },
        ],
      })
    );
    const content = plan.workPackages.filter((p) => p.type === "content_creation");
    const concepts = content.filter((p) => p.deliverableType === "campaign_concept");
    expect(concepts).toHaveLength(1);
    expect(concepts[0]?.channel).toBe("Campaign");
    expect(content.filter((p) => p.deliverableType === "generic")).toHaveLength(1);
    expect(content.some((p) => p.channel === "Email" && p.deliverableType === "generic")).toBe(true);
  });

  it("blocked decision creates blocked plan and blocked content packages", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitChannels: ["LinkedIn"],
        decisionSummary: {
          id: "dec-block",
          status: "blocked",
          canExecute: false,
          canGenerateCreative: false,
          blockedReasons: ["Paid spend disabled."],
        },
      })
    );
    expect(plan.status).toBe("blocked");
    const content = plan.workPackages.filter((p) => p.type === "content_creation");
    expect(content.every((p) => p.status === "blocked")).toBe(true);
    expect(content[0]?.blockers).toContain("Paid spend disabled.");
  });

  it("restricted decision preserves approval requirements on content packages", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
        decisionSummary: {
          id: "dec-restrict",
          status: "restricted",
          canExecute: true,
          canGenerateCreative: false,
          approvalMode: "approval_before_generation",
          brandReviewRequired: true,
        },
      })
    );
    expect(plan.status).toBe("restricted");
    const content = plan.workPackages.find((p) => p.type === "content_creation")!;
    expect(content.approvalRequirement.required).toBe(true);
    expect(content.approvalRequirement.mode).toBe("approval_before_generation");
    expect(content.approvalRequirement.brandReviewRequired).toBe(true);
  });

  it("strategy and plan summaries add evidence and reduce strategy/plan gap severity", () => {
    const without = planCampaignExecution(buildSource());
    const withIntel = planCampaignExecution(
      buildSource({
        strategySummary: {
          summary: "SMB inbound strategy",
          confidence: "high",
        },
        planSummary: {
          summary: "Q3 calendar plan",
          confidence: "moderate",
          contentCalendar: [],
        },
      })
    );
    expect(withIntel.evidence.some((e) => e.kind === "strategy")).toBe(true);
    expect(withIntel.evidence.some((e) => e.kind === "plan")).toBe(true);
    const strategyPkg = withIntel.workPackages.find((p) => p.type === "campaign_strategy")!;
    expect(strategyPkg.sourceReferences.some((r) => r.kind === "strategy")).toBe(true);
    expect(without.gaps.some((g) => g.id === "gap-strategy")).toBe(true);
    expect(withIntel.gaps.some((g) => g.id === "gap-strategy")).toBe(false);
    expect(withIntel.gaps.some((g) => g.id === "gap-plan")).toBe(false);
  });

  it("creative brief references enable creative-direction source refs", () => {
    const plan = planCampaignExecution(
      buildSource({
        creativeBriefRefs: [{ id: "brief-42", contentType: "social_post", channel: "linkedin" }],
      })
    );
    const creative = plan.workPackages.find((p) => p.type === "creative_direction")!;
    expect(creative.sourceReferences.some((r) => r.kind === "creative_brief" && r.ref === "brief-42")).toBe(
      true
    );
    expect(plan.gaps.some((g) => g.id === "gap-creative-brief")).toBe(false);
  });

  it("existing work units prevent duplicate satisfaction via merge", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post", title: "Post A" }],
        existingWorkUnits: [
          {
            id: "wu-1",
            projectId: "camp-1",
            title: "Post A",
            channel: "LinkedIn",
            deliverableKind: "linkedin_post",
            planActivityReference: null,
            lifecycleStage: "creating",
          },
        ],
      })
    );
    const content = plan.workPackages.filter((p) => p.type === "content_creation");
    expect(content).toHaveLength(1);
    expect(content[0]?.matchedWorkUnitId).toBe("wu-1");
    expect(content[0]?.status).toBe("in_progress");
  });

  it("completed work units satisfy equivalent content packages", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
        existingWorkUnits: [
          {
            id: "wu-done",
            projectId: "camp-1",
            title: "Done post",
            channel: "LinkedIn",
            deliverableKind: "linkedin_post",
            lifecycleStage: "published",
          },
        ],
      })
    );
    const content = plan.workPackages.find((p) => p.type === "content_creation")!;
    expect(content.status).toBe("satisfied");
    expect(content.matchedWorkUnitId).toBe("wu-done");
  });

  it("preserves blockers from existing work units", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
        existingWorkUnits: [
          {
            id: "wu-blocked",
            title: "Blocked",
            channel: "LinkedIn",
            deliverableKind: "linkedin_post",
            lifecycleStage: "planning",
            blockers: ["Integration not connected."],
          },
        ],
      })
    );
    const content = plan.workPackages.find((p) => p.type === "content_creation")!;
    expect(content.status).toBe("blocked");
    expect(content.blockers).toContain("Integration not connected.");
  });

  it("dependencies are valid, acyclic, and execution order respects them", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitChannels: ["LinkedIn"],
        planSummary: {
          summary: "Plan",
          confidence: "high",
          contentCalendar: [
            { title: "LinkedIn post", contentType: "linkedin_post", channel: "LinkedIn" },
          ],
        },
      })
    );
    validateCampaignWorkPackageDependencies(plan.workPackages);
    const order = deriveCampaignExecutionOrder(plan.workPackages);
    expect(order).toEqual(plan.executionOrder);

    const index = (id: string) => plan.executionOrder.indexOf(id);
    const strategy = plan.workPackages.find((p) => p.type === "campaign_strategy")!;
    const research = plan.workPackages.find((p) => p.type === "research")!;
    expect(index(strategy.id)).toBeGreaterThan(index(research.id));

    const review = plan.workPackages.find((p) => p.type === "review")!;
    const contentIds = plan.workPackages.filter((p) => p.type === "content_creation").map((p) => p.id);
    for (const cid of contentIds) {
      expect(index(review.id)).toBeGreaterThan(index(cid));
    }
  });

  it("rejects self-dependencies and cycles", () => {
    const packages: CampaignWorkPackage[] = [
      {
        id: "a",
        type: "research",
        title: "A",
        description: "",
        status: "proposed",
        priority: 1,
        phase: "research",
        dependencies: ["a"],
        recommendedOwner: { role: "analyst" },
        estimatedEffort: "low",
        approvalRequirement: { required: false },
        sourceReferences: [],
        blockers: [],
        completionCriteria: "",
      },
    ];
    expect(() => validateCampaignWorkPackageDependencies(packages)).toThrow(
      CampaignPlannerDependencyError
    );

    const cyclic: CampaignWorkPackage[] = [
      {
        id: "x",
        type: "research",
        title: "X",
        description: "",
        status: "proposed",
        priority: 1,
        phase: "research",
        dependencies: ["y"],
        recommendedOwner: { role: "analyst" },
        estimatedEffort: "low",
        approvalRequirement: { required: false },
        sourceReferences: [],
        blockers: [],
        completionCriteria: "",
      },
      {
        id: "y",
        type: "positioning",
        title: "Y",
        description: "",
        status: "proposed",
        priority: 2,
        phase: "strategy",
        dependencies: ["x"],
        recommendedOwner: { role: "campaign_planner" },
        estimatedEffort: "low",
        approvalRequirement: { required: false },
        sourceReferences: [],
        blockers: [],
        completionCriteria: "",
      },
    ];
    expect(() => validateCampaignWorkPackageDependencies(cyclic)).toThrow(
      CampaignPlannerDependencyError
    );
  });

  it("does not invent budget or performance metric values", () => {
    const plan = planCampaignExecution(
      buildSource({
        explicitChannels: ["LinkedIn"],
        campaignOverrides: {
          budget: { allocated: 5000, currency: "USD" },
          kpiPlaceholders: [{ id: "k1", name: "Signups", targetValue: "100" }],
        },
      })
    );
    const json = JSON.stringify(plan);
    expect(json).not.toContain('"allocated":5000');
    expect(json).not.toContain("targetValue");
    expect(json).not.toContain('"spent"');
    const monitoring = plan.workPackages.find((p) => p.type === "performance_monitoring")!;
    expect(monitoring.completionCriteria.toLowerCase()).toContain("invented");
  });

  it("is deterministic for identical sources", () => {
    const source = buildSource({ explicitChannels: ["LinkedIn"] });
    const a = planCampaignExecution(source);
    const b = planCampaignExecution(source);
    expect(a).toEqual(b);
  });

  it("does not mutate the source object", () => {
    const source = buildSource({
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
      existingWorkUnits: [
        {
          id: "wu-1",
          title: "T",
          channel: "LinkedIn",
          deliverableKind: "linkedin_post",
          lifecycleStage: "planning",
        },
      ],
    });
    const snapshot = JSON.stringify(source);
    planCampaignExecution(source);
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  it("throws on invalid source", () => {
    expect(() =>
      planCampaignExecution({
        organizationId: "",
        peerId: "peer-1",
        campaign: assembleCampaign({
          organizationId: "org-1",
          campaignId: "c1",
          name: "N",
          assembledAt,
        }),
        assembledAt,
      })
    ).toThrow(CampaignPlannerInvalidSourceError);
  });
});
