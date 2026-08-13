import { describe, expect, it } from "vitest";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  acquireBrainContext,
  detectContextAcquisitionGaps,
  itemMatchesRequirement,
  itemSatisfiesRequirement,
  resolveContextRequirements,
} from "../../index";
import { projectContextAdapter } from "../project-adapter";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";

const ORG = "org-project-adapter-test";
const PROJECT_ID = "proj-objective-fix";
const mockSupabase = {} as AppSupabaseClient;

const AUTOMATIC_OBJECTIVE = "Generate more qualified leads for Peergent.";

function automaticWizardProject() {
  return createMarketingCampaignProject({
    peerId: "emma",
    ownerLabel: "Emma",
    name: "Peergent Launch",
    goalLabel: AUTOMATIC_OBJECTIVE,
    description: AUTOMATIC_OBJECTIVE,
    primaryGoalId: "custom",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
  });
}

function campaignContextFromAutomaticWizard() {
  const project = automaticWizardProject();
  return buildCampaignContext({
    project,
    domainInput: {
      peerId: "emma",
      organizationId: ORG,
      userName: "",
      peerName: "Emma",
      campaignTitle: project.title,
      generating: null,
      generatingActivity: null,
      understanding: null,
      strategy: null,
      plan: null,
      drafts: [],
      publicationPackages: [],
      activityFeed: [],
      workUnits: [],
      projects: [project],
      responsibilities: [],
      automations: [],
      connections: [],
    },
    locale: "en",
  });
}

describe("projectContextAdapter — project.objective propagation", () => {
  it("A — automatic wizard goal reaches canonical project.objective", async () => {
    const ctx = campaignContextFromAutomaticWizard();
    expect(ctx.description).toBe(AUTOMATIC_OBJECTIVE);
    expect(ctx.goals.length).toBeGreaterThan(0);

    const result = await projectContextAdapter.acquire({
      supabase: mockSupabase,
      organizationId: ORG,
      projectId: PROJECT_ID,
      peerId: "emma",
      requirements: resolveContextRequirements({ peerRole: "Marketing", phase: "project_start" }),
      budget: { maxItemsPerAdapter: 24, maxTotalItems: 100, maxSummaryChars: 512 },
      locale: "en",
      peerRole: "Marketing",
      campaignContext: ctx,
    });

    const objective = result.items.find((item) => item.key === "project.objective");
    const goals = result.items.find((item) => item.key === "project.goals");

    expect(objective?.summary).toBe(AUTOMATIC_OBJECTIVE);
    expect(goals).toBeTruthy();
    expect(itemMatchesRequirement(objective!, "project.objective")).toBe(true);
    expect(itemMatchesRequirement(goals!, "project.goals")).toBe(true);
  });

  it("B — supplied objective does not generate a false blocking project.objective gap", async () => {
    const ctx = campaignContextFromAutomaticWizard();
    const result = await projectContextAdapter.acquire({
      supabase: mockSupabase,
      organizationId: ORG,
      projectId: PROJECT_ID,
      peerId: "emma",
      requirements: resolveContextRequirements({ peerRole: "Marketing", phase: "project_start" }),
      budget: { maxItemsPerAdapter: 24, maxTotalItems: 100, maxSummaryChars: 512 },
      locale: "en",
      peerRole: "Marketing",
      campaignContext: ctx,
    });

    const requirements = resolveContextRequirements({ peerRole: "Marketing", phase: "project_start" });
    const gaps = detectContextAcquisitionGaps({
      requirements,
      items: result.items,
      adapterResults: [result],
    });

    expect(
      gaps.some((gap) => gap.requirement.key === "project.objective" && gap.severity === "blocking")
    ).toBe(false);
    expect(itemSatisfiesRequirement(result.items, "project.objective")).toBe(true);
  });

  it("C — missing objective still generates a blocking project.objective gap", async () => {
    const result = await projectContextAdapter.acquire({
      supabase: mockSupabase,
      organizationId: ORG,
      projectId: PROJECT_ID,
      peerId: "emma",
      requirements: resolveContextRequirements({ peerRole: "Marketing", phase: "project_start" }),
      budget: { maxItemsPerAdapter: 24, maxTotalItems: 100, maxSummaryChars: 512 },
      locale: "en",
      peerRole: "Marketing",
      campaignContext: {
        ...campaignContextFromAutomaticWizard(),
        description: "",
        goals: [],
      },
    });

    const requirements = resolveContextRequirements({ peerRole: "Marketing", phase: "project_start" });
    const gaps = detectContextAcquisitionGaps({
      requirements,
      items: result.items,
      adapterResults: [result],
    });

    const objectiveGap = gaps.find(
      (gap) => gap.requirement.key === "project.objective" && gap.severity === "blocking"
    );
    expect(objectiveGap).toBeTruthy();
    expect(itemSatisfiesRequirement(result.items, "project.objective")).toBe(false);
  });

  it("D — end-to-end acquireBrainContext includes project.objective for automatic wizard context", async () => {
    const ctx = campaignContextFromAutomaticWizard();
    const pkg = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG,
        projectId: PROJECT_ID,
        peerId: "emma",
        task: { peerRole: "Marketing", phase: "project_start", locale: "en" },
        campaignContext: ctx,
      },
      { adapters: [projectContextAdapter] }
    );

    expect(
      pkg.items.some(
        (item) => item.key === "project.objective" && item.summary === AUTOMATIC_OBJECTIVE
      )
    ).toBe(true);
    expect(
      pkg.acquisitionGaps.some(
        (gap) => gap.requirement.key === "project.objective" && gap.severity === "blocking"
      )
    ).toBe(false);
  });
});
