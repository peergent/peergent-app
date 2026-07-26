import { describe, expect, it, vi } from "vitest";

import {
  assertCustomerSafeExecutionPlanViewModel,
  presentCampaignExecutionPlan,
} from "@/features/marketing-workspace/lib/campaign-execution-plan-presenter";
import type { CampaignExecutionPlan } from "@/lib/campaign/planner";
import {
  createMarketingCampaignProject,
  createMarketingProject,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  createEmptyCreateCampaignForm,
  toCreateMarketingCampaignProjectInput,
} from "@/features/marketing-workspace/lib/create-campaign-form";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import {
  buildCampaignExecutionPlanViewModel,
  buildCampaignExecutionPlanViewModelOrUnavailable,
} from "../build-campaign-execution-plan-view-model";
import type { MarketingPeerDomainInput } from "../../view-models/marketing-peer-domain-input";
import * as sourceModule from "../build-campaign-planner-source-from-domain-input";

const assembledAt = "2026-07-20T12:00:00.000Z";

function baseInput(projects: MarketingPeerDomainInput["projects"], workUnits: WorkUnit[] = []) {
  return {
    peerId: "peer-emma",
    organizationId: "org-1",
    userName: "Alex",
    peerName: "Emma",
    campaignTitle: "Campaign",
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits,
    projects,
    responsibilities: [],
    automations: [],
    connections: [],
  } satisfies MarketingPeerDomainInput;
}

function sampleWorkUnit(overrides: Partial<WorkUnit> & Pick<WorkUnit, "id" | "projectId">): WorkUnit {
  return {
    peerId: "peer-emma",
    role: "Marketing",
    title: "LinkedIn post",
    status: "creating",
    deliverableKind: "linkedin",
    channel: "LinkedIn",
    objective: null,
    audience: null,
    needsVisual: false,
    recurrence: "once",
    automationTrigger: null,
    draftId: null,
    planActivityReference: null,
    rawRequest: "x",
    startedAt: assembledAt,
    updatedAt: assembledAt,
    estimatedCompletionAt: null,
    artifacts: [],
    eventLog: [],
    paused: false,
    cancelled: false,
    ...overrides,
  };
}

describe("buildCampaignExecutionPlanViewModel", () => {
  it("produces a visible plan for campaign-wizard projects", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow pipeline",
        primaryGoalId: "product_launch",
      })
    );
    const result = buildCampaignExecutionPlanViewModel({
      projectId: project.id,
      domainInput: baseInput([project]),
      assembledAt,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.viewModel.availability).toBe("visible");
    expect(result.viewModel.workItems.length).toBeGreaterThan(0);
    assertCustomerSafeExecutionPlanViewModel(result.viewModel);
  });

  it("orders work items by planner execution order", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow",
        primaryGoalId: "brand_awareness",
      })
    );
    const result = buildCampaignExecutionPlanViewModel({
      projectId: project.id,
      domainInput: baseInput([project]),
      assembledAt,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const titles = result.viewModel.workItems.map((i) => i.title);
    const researchIndex = titles.findIndex((t) => t.toLowerCase().includes("audience") || t.toLowerCase().includes("research"));
    const strategyIndex = titles.findIndex((t) => t.toLowerCase().includes("strategy"));
    if (researchIndex >= 0 && strategyIndex >= 0) {
      expect(researchIndex).toBeLessThan(strategyIndex);
    }
  });

  it("does not expose raw ids or internal terms in the view model", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow",
        primaryGoalId: "brand_awareness",
      })
    );
    const result = buildCampaignExecutionPlanViewModel({
      projectId: project.id,
      domainInput: baseInput([project]),
      assembledAt,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const json = JSON.stringify(result.viewModel);
    expect(json).not.toContain(":pkg:");
    expect(json).not.toContain("campaign_wizard");
    expect(json).not.toContain("scopeNotes");
    expect(json).not.toContain("CampaignExecutionPlan");
  });

  it("surfaces missing channels as customer guidance", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow",
        primaryGoalId: "brand_awareness",
      })
    );
    const result = buildCampaignExecutionPlanViewModel({
      projectId: project.id,
      domainInput: baseInput([project]),
      assembledAt,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.viewModel.missingInformation.some((m) =>
        m.toLowerCase().includes("channel")
      )
    ).toBe(true);
    expect(result.viewModel.workItems.every((i) => !i.channelLabel?.includes("LinkedIn"))).toBe(
      true
    );
  });

  it("reflects linked work units as in progress", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow",
        primaryGoalId: "brand_awareness",
      })
    );
    const unit = sampleWorkUnit({
      id: "wu-1",
      projectId: project.id,
      deliverableKind: "linkedin_post",
      channel: "LinkedIn",
    });
    const result = buildCampaignExecutionPlanViewModel({
      projectId: project.id,
      domainInput: baseInput([project], [unit]),
      assembledAt,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.viewModel.workItems.some((i) => i.statusLabel === "In progress")
    ).toBe(true);
  });

  it("returns unavailable on planner source errors without throwing", () => {
    const vm = buildCampaignExecutionPlanViewModelOrUnavailable({
      projectId: "missing-project",
      domainInput: baseInput([]),
      assembledAt,
    });
    expect(vm.availability).toBe("unavailable");
    expect(vm.unavailableMessage).toContain("temporarily unavailable");
  });

  it("handles planner build failures safely", () => {
    vi.spyOn(sourceModule, "buildCampaignPlannerSourceFromDomainInput").mockImplementation(() => {
      throw new Error("unexpected");
    });
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow",
        primaryGoalId: "brand_awareness",
      })
    );
    const result = buildCampaignExecutionPlanViewModel({
      projectId: project.id,
      domainInput: baseInput([project]),
      assembledAt,
    });
    vi.restoreAllMocks();
    expect(result.ok).toBe(false);
    expect(result.unavailableMessage).toContain("temporarily unavailable");
  });

  it("preserves blocked plan presentation", () => {
    const blockedPlan = {
      id: "cep-1",
      campaignId: "c1",
      organizationId: "org-1",
      version: 1,
      status: "blocked",
      objective: "Grow",
      workPackages: [
        {
          id: "camp-1:pkg:content_creation:linkedin-linkedin_post-0",
          type: "content_creation",
          title: "Create post",
          description: "d",
          status: "blocked",
          priority: 60,
          phase: "production",
          dependencies: [],
          recommendedOwner: { role: "copywriter" },
          estimatedEffort: "high",
          approvalRequirement: { required: true },
          channel: "LinkedIn",
          deliverableType: "linkedin_post",
          sourceReferences: [],
          blockers: ["Policy block"],
          completionCriteria: "",
        },
      ],
      executionOrder: ["camp-1:pkg:content_creation:linkedin-linkedin_post-0"],
      approvals: [],
      gaps: [],
      evidence: [],
      assembledAt,
    } satisfies CampaignExecutionPlan;
    const vm = presentCampaignExecutionPlan({ plan: blockedPlan });
    expect(vm.overallStatus).toBe("blocked");
    expect(vm.blockers.length).toBeGreaterThan(0);
    assertCustomerSafeExecutionPlanViewModel(vm);
  });

  it("does not mutate domain input", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow",
        primaryGoalId: "brand_awareness",
      })
    );
    const input = baseInput([project]);
    const before = JSON.stringify(input);
    buildCampaignExecutionPlanViewModel({
      projectId: project.id,
      domainInput: input,
      assembledAt,
    });
    expect(JSON.stringify(input)).toBe(before);
  });

  it("manual project path is not built here but conservative domain still plans when invoked", () => {
    const manual = createMarketingProject({
      peerId: "peer-emma",
      title: "Manual",
      goal: "g",
      channel: "LinkedIn",
      deliverableKind: "linkedin",
      rawRequest: "x",
      ownerLabel: "Alex",
      origin: "manual_assignment",
    });
    const result = buildCampaignExecutionPlanViewModel({
      projectId: manual.id,
      domainInput: baseInput([manual]),
      assembledAt,
    });
    expect(result.ok).toBe(true);
  });
});
