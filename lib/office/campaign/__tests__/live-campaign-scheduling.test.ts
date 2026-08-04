import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  persistLiveCampaignSchedule,
} from "@/lib/office/campaign/live-campaign-context-store";
import { loadMarketingWorkspaceState, saveMarketingWorkspaceState } from "@/lib/marketing-workspace/storage";
import { buildCampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import {
  CampaignIntelligenceOrchestrator,
  orchestrationPrimaryActionToCta,
} from "@/lib/office/campaign/campaign-intelligence-orchestrator";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { isCampaignScheduled } from "@/lib/office/campaign/campaign-schedule-state";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const PEER = "emma";
const PROJECT_ID = "camp-live-schedule";

function buildDomainInput(project: MarketingProject): MarketingPeerDomainInput {
  return {
    peerId: PEER,
    userName: "User",
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
  };
}

function readyProject(): MarketingProject {
  const base = createMarketingCampaignProject({
    peerId: PEER,
    ownerLabel: "Emma",
    name: "Acme Launch",
    goalLabel: "Demo requests",
    description: "Grow demo requests from SMB owners.",
    primaryGoalId: "generate_leads",
    targetAudience: "SMB owners",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
  });
  return {
    ...base,
    id: PROJECT_ID,
    peerId: PEER,
    campaignSetup: {
      ...base.campaignSetup!,
      campaignContextVersion: 1,
      businessAnalyzedApproved: true,
      campaignBrandContext: {
        brandName: "Acme",
        industry: "SaaS",
        targetAudience: "SMB owners",
        productsAndServices: ["Platform"],
        uniqueSellingPoints: ["Speed"],
      },
      stepApprovals: {
        strategy_determined: "approved",
        channels_selected: "approved",
        deliverables_created: "approved",
      },
      selectedChannels: ["linkedin", "email"],
    },
  };
}

describe("live campaign scheduling", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: undefined });
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
    saveMarketingWorkspaceState(PEER, { projects: [readyProject()] });
  });

  it("persists schedule date, time, timezone and approval on campaignSetup", () => {
    const scheduledAt = "2026-09-15T07:00:00.000Z";
    const updated = persistLiveCampaignSchedule(PEER, PROJECT_ID, {
      scheduledAt,
      timezone: "Europe/Amsterdam",
      channels: ["linkedin"],
    });

    expect(updated).not.toBeNull();
    const schedule = updated!.campaignSetup?.campaignSchedule;
    expect(schedule?.scheduledAt).toBe(scheduledAt);
    expect(schedule?.timezone).toBe("Europe/Amsterdam");
    expect(schedule?.source).toBe("customer_scheduled");
    expect(schedule?.contextVersion).toBe(1);
    expect(updated!.campaignSetup?.stepApprovals?.scheduled).toBe("approved");

    const stored = loadMarketingWorkspaceState(PEER);
    const persisted = stored.projects?.find((p) => p.id === PROJECT_ID);
    expect(persisted?.campaignSetup?.campaignSchedule?.scheduledAt).toBe(scheduledAt);
  });

  it("rejects scheduling before deliverables approval", () => {
    saveMarketingWorkspaceState(PEER, {
      projects: [
        {
          ...readyProject(),
          campaignSetup: {
            ...readyProject().campaignSetup!,
            stepApprovals: {
              strategy_determined: "approved",
              channels_selected: "approved",
            },
          },
        },
      ],
    });
    const result = persistLiveCampaignSchedule(PEER, PROJECT_ID, {
      scheduledAt: new Date().toISOString(),
      timezone: "Europe/Amsterdam",
    });
    expect(result).toBeNull();
  });

  it("marks workflow scheduled and exposes edit-schedule CTA after persistence", () => {
    persistLiveCampaignSchedule(PEER, PROJECT_ID, {
      scheduledAt: "2026-09-15T07:00:00.000Z",
      timezone: "Europe/Amsterdam",
    });

    const stored = loadMarketingWorkspaceState(PEER);
    const project = stored.projects!.find((p) => p.id === PROJECT_ID)!;
    const domainInput = buildDomainInput(project);

    expect(isCampaignScheduled(project, domainInput, false)).toBe(true);

    const detail = buildCampaignDetailViewModel({
      peerId: PEER,
      projectId: PROJECT_ID,
      domainInput,
      locale: "nl",
      isDemo: false,
    });
    expect(detail?.lifecycleStatus).toBe("scheduled");
    expect(detail?.scheduleInfo?.integrationsNote).toContain("Publicatiekoppelingen");

    const workflow = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project,
      domainInput,
      locale: "nl",
      isDemo: false,
    });
    expect(workflow.steps.find((s) => s.id === "scheduled")?.state).toBe("done");
    expect(workflow.steps.find((s) => s.id === "published")?.state).toBe("upcoming");
    expect(workflow.steps.find((s) => s.id === "scheduled")?.statusHint).toContain(
      "Campagne is ingepland"
    );
    expect(workflow.steps.find((s) => s.id === "published")?.statusHint).toContain(
      "Automatische publicatie"
    );
    expect(workflow.nextStep).toContain("Automatische publicatie");

    const orchestration = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: buildCampaignContext({ project, domainInput }),
      stepApprovals: project.campaignSetup?.stepApprovals,
      isCampaignScheduled: true,
      isCampaignPublished: false,
      isDemo: false,
      publishingState: "not_configured",
    });
    expect(orchestration.activeCustomerStepId).toBeNull();
    const cta = orchestrationPrimaryActionToCta(orchestration.primaryAction);
    expect(cta.action).toBe("schedule");
    expect(cta.label).toMatch(/Planning wijzigen|Edit schedule/);
  });
});
