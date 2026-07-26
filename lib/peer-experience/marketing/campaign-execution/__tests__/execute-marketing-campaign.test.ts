import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  createMarketingCampaignProject,
  createMarketingProject,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import { createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

import { executeMarketingCampaign } from "../execute-marketing-campaign";
import { CampaignExecutionWorkspaceFeatureDisabledError } from "../campaign-execution-workspace-result";

const assembledAt = "2026-07-20T12:00:00.000Z";
const peerId = "peer-1";
const organizationId = "org-1";
const __dirname = dirname(fileURLToPath(import.meta.url));

function domainInput(
  projects: MarketingPeerDomainInput["projects"],
  workUnits: MarketingPeerDomainInput["workUnits"] = []
): MarketingPeerDomainInput {
  return {
    peerId,
    organizationId,
    userName: "You",
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
  };
}

function readyCampaignProject() {
  return createMarketingCampaignProject({
    peerId,
    ownerLabel: "You",
    name: "Launch",
    goalLabel: "Awareness",
    description: "Campaign",
    primaryGoalId: "brand_awareness",
  });
}

function domainWithLinkedInChannel(
  project: ReturnType<typeof readyCampaignProject>,
  extraUnits: MarketingPeerDomainInput["workUnits"] = []
): MarketingPeerDomainInput {
  const signal = createWorkUnit({
    peerId,
    projectId: project.id,
    role: "Marketing",
    title: "LinkedIn anchor",
    deliverableKind: "linkedin",
    channel: "LinkedIn",
    objective: "Signal channel for planner",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Planner channel signal",
  });
  return domainInput([project], [signal, ...extraUnits]);
}


describe("executeMarketingCampaign", () => {
  it("starts campaign-wizard project and creates work units", async () => {
    const project = readyCampaignProject();
    const input = domainWithLinkedInChannel(project);
    let committed: { projects: typeof input.projects; workUnits: typeof input.workUnits } | null =
      null;

    const result = await executeMarketingCampaign({
      projectId: project.id,
      domainInput: input,
      requestedBy: "user-1",
      executedAt: assembledAt,
      campaignWorkspaceEnabled: true,
      getWorkspaceSnapshot: () => ({ projects: input.projects, workUnits: input.workUnits }),
      commitWorkspaceState: (next) => {
        committed = next;
      },
    });

    expect(result.status).toBe("started");
    expect(result.createdWorkUnitIds.length).toBeGreaterThan(0);
    expect(committed).not.toBeNull();
    expect(committed!.workUnits.length).toBeGreaterThanOrEqual(result.createdWorkUnitIds.length);
  });

  it("rejects legacy projects with no writes", async () => {
    const manual = createMarketingProject({
      peerId,
      title: "Manual",
      goal: "Goal",
      channel: "LinkedIn",
      deliverableKind: "linkedin",
      rawRequest: "Post",
      ownerLabel: "You",
    });
    let committed = false;
    const result = await executeMarketingCampaign({
      projectId: manual.id,
      domainInput: domainInput([manual]),
      requestedBy: "user-1",
      executedAt: assembledAt,
      campaignWorkspaceEnabled: true,
      commitWorkspaceState: () => {
        committed = true;
      },
    });

    expect(result.status).toBe("failed");
    expect(committed).toBe(false);
    expect(result.createdWorkUnitIds).toHaveLength(0);
  });

  it("returns restricted when feature disabled", async () => {
    const project = readyCampaignProject();
    await expect(
      executeMarketingCampaign({
        projectId: project.id,
        domainInput: domainInput([project]),
        requestedBy: "user-1",
        executedAt: assembledAt,
        campaignWorkspaceEnabled: false,
      })
    ).rejects.toThrow(CampaignExecutionWorkspaceFeatureDisabledError);
  });

  it("does not write for draft planner status", async () => {
    const project = readyCampaignProject();
    let committed = false;
    const result = await executeMarketingCampaign({
      projectId: project.id,
      domainInput: domainInput([project]),
      requestedBy: "user-1",
      executedAt: assembledAt,
      campaignWorkspaceEnabled: true,
      commitWorkspaceState: () => {
        committed = true;
      },
    });

    expect(result.plannerStatus).toBe("draft");
    expect(result.status).toBe("restricted");
    expect(committed).toBe(false);
  });

  it("does not write when execution is not eligible", async () => {
    const project = readyCampaignProject();
    let committed = false;
    const result = await executeMarketingCampaign({
      projectId: project.id,
      domainInput: domainInput([project]),
      requestedBy: "user-1",
      executedAt: assembledAt,
      campaignWorkspaceEnabled: true,
      commitWorkspaceState: () => {
        committed = true;
      },
    });

    expect(["blocked", "restricted"]).toContain(result.status);
    expect(committed).toBe(false);
  });

  it("executing twice does not duplicate units", async () => {
    const project = readyCampaignProject();
    const input = domainWithLinkedInChannel(project);
    let state = { projects: input.projects, workUnits: input.workUnits };

    const first = await executeMarketingCampaign({
      projectId: project.id,
      domainInput: input,
      requestedBy: "user-1",
      executedAt: assembledAt,
      campaignWorkspaceEnabled: true,
      getWorkspaceSnapshot: () => state,
      commitWorkspaceState: (next) => {
        state = { projects: [...next.projects], workUnits: [...next.workUnits] };
      },
    });

    const second = await executeMarketingCampaign({
      projectId: project.id,
      domainInput: { ...input, workUnits: state.workUnits, projects: state.projects },
      requestedBy: "user-1",
      executedAt: assembledAt,
      campaignWorkspaceEnabled: true,
      getWorkspaceSnapshot: () => state,
      commitWorkspaceState: (next) => {
        state = { projects: [...next.projects], workUnits: [...next.workUnits] };
      },
    });

    expect(first.createdWorkUnitIds.length).toBeGreaterThan(0);
    expect(second.status).toBe("already_started");
    expect(state.workUnits.length).toBeGreaterThanOrEqual(first.createdWorkUnitIds.length);
  });

  it("preserves unrelated projects and work units", async () => {
    const project = readyCampaignProject();
    const otherProject = createMarketingProject({
      peerId,
      title: "Other",
      goal: "Other goal",
      channel: "Instagram",
      deliverableKind: "instagram",
      rawRequest: "Other",
      ownerLabel: "You",
    });
    const otherUnit = createWorkUnit({
      peerId,
      projectId: otherProject.id,
      role: "Marketing",
      title: "Other unit",
      deliverableKind: "instagram",
      channel: "Instagram",
      objective: null,
      audience: null,
      needsVisual: true,
      recurrence: "once",
      rawRequest: "Other",
    });

    const input = domainWithLinkedInChannel(project, [otherUnit]);
    let state = {
      projects: [project, otherProject],
      workUnits: input.workUnits,
    };

    await executeMarketingCampaign({
      projectId: project.id,
      domainInput: { ...input, projects: state.projects },
      requestedBy: "user-1",
      executedAt: assembledAt,
      campaignWorkspaceEnabled: true,
      getWorkspaceSnapshot: () => state,
      commitWorkspaceState: (next) => {
        state = { projects: [...next.projects], workUnits: [...next.workUnits] };
      },
    });

    expect(state.projects.some((p) => p.id === otherProject.id)).toBe(true);
    expect(state.workUnits.some((u) => u.id === otherUnit.id)).toBe(true);
  });

  it("translates persistence failures safely", async () => {
    const project = readyCampaignProject();
    const result = await executeMarketingCampaign({
      projectId: project.id,
      domainInput: domainWithLinkedInChannel(project),
      requestedBy: "user-1",
      executedAt: assembledAt,
      campaignWorkspaceEnabled: true,
      persistence: {
        createWorkUnit: () => {
          throw new Error("Database connection failed");
        },
        updateWorkUnit: (u) => u,
        updateProject: (p) => p,
      },
    });

    expect(result.status).toBe("failed");
    expect(JSON.stringify(result)).not.toContain("Database connection failed");
  });

  it("does not mutate domain input", async () => {
    const project = readyCampaignProject();
    const input = domainInput([project]);
    const snapshot = JSON.stringify(input);
    await executeMarketingCampaign({
      projectId: project.id,
      domainInput: input,
      requestedBy: "user-1",
      executedAt: assembledAt,
      campaignWorkspaceEnabled: true,
    });
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("useMarketingWorkspace hook surface", () => {
  it("exposes handleStartCampaignExecution without auto-invoking it", () => {
    const hookSource = readFileSync(
      join(__dirname, "../../../../../hooks/useMarketingWorkspace.ts"),
      "utf8"
    );
    expect(hookSource).toContain("handleStartCampaignExecution,");
    expect(hookSource).toMatch(/handleStartCampaignExecution = useCallback/);
    expect(hookSource).not.toMatch(
      /useEffect\(\(\) => \{[\s\S]{0,4000}?handleStartCampaignExecution\(/
    );
  });
});
