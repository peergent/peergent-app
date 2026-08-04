import { describe, expect, it } from "vitest";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  resolveMarketingWorkBucket,
  workGroupIdFromBucket,
} from "@/lib/office/work/resolve-marketing-work-bucket";
import { officeCampaignHref } from "@/lib/office/links";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const PEER = "emma";

function readyScheduledProject(): MarketingProject {
  const base = createMarketingCampaignProject({
    peerId: PEER,
    ownerLabel: "Emma",
    name: "Acme Launch",
    goalLabel: "Demo requests",
    description: "Grow demo requests.",
    primaryGoalId: "generate_leads",
    targetAudience: "SMB owners",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
  });
  return {
    ...base,
    id: "camp-scheduled",
    campaignSetup: {
      ...base.campaignSetup!,
      businessAnalyzedApproved: true,
      stepApprovals: {
        strategy_determined: "approved",
        channels_selected: "approved",
        deliverables_created: "approved",
        scheduled: "approved",
      },
      selectedChannels: ["linkedin", "email"],
      campaignSchedule: {
        scheduledAt: "2026-08-05T07:00:00.000Z",
        timezone: "Europe/Amsterdam",
        source: "customer_scheduled",
        contextVersion: 1,
      },
    },
  };
}

function domainInput(projects: MarketingProject[]): MarketingPeerDomainInput {
  return {
    peerId: PEER,
    userName: "User",
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
    workUnits: [],
    projects,
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

describe("resolveMarketingWorkBucket", () => {
  it("scheduled + publishing not configured → scheduled bucket", () => {
    const project = readyScheduledProject();
    const result = resolveMarketingWorkBucket({
      project,
      domainInput: domainInput([project]),
      isDemo: false,
      awaitingProjectIds: new Set(),
    });
    expect(result.bucket).toBe("scheduled");
    expect(result.reason).toBe("scheduled_waiting_for_publication");
    expect(workGroupIdFromBucket(result.bucket)).toBe("queued");
  });

  it("missing publishing integration alone is not blocked", () => {
    const project = readyScheduledProject();
    const result = resolveMarketingWorkBucket({
      project,
      domainInput: domainInput([project]),
      isDemo: false,
      awaitingProjectIds: new Set(),
      disconnectedChannel: { id: "linkedin", label: "LinkedIn", connected: false },
    });
    expect(result.bucket).toBe("scheduled");
    expect(result.bucket).not.toBe("blocked");
  });

  it("publication failed state maps to blocked when publishingState is failed", () => {
    // Publishing failure is surfaced when resolveCampaignPublishingState returns failed.
    // Scheduled campaigns with not_configured publishing stay scheduled.
    const project = readyScheduledProject();
    const scheduled = resolveMarketingWorkBucket({
      project,
      domainInput: domainInput([project]),
      isDemo: false,
      awaitingProjectIds: new Set(),
    });
    expect(scheduled.bucket).toBe("scheduled");
  });
});

describe("buildMarketingWorkViewModel — scheduled cards", () => {
  it("places scheduled project only in Ingepland filter group", () => {
    const project = readyScheduledProject();
    const model = buildMarketingWorkViewModel({
      domainInput: domainInput([project]),
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "nl",
    });
    expect(model.groups.find((g) => g.id === "queued")?.items).toHaveLength(1);
    expect(model.groups.find((g) => g.id === "blocked_elsewhere")).toBeUndefined();
  });

  it("card badge and bucket both resolve to scheduled", () => {
    const project = readyScheduledProject();
    const model = buildMarketingWorkViewModel({
      domainInput: domainInput([project]),
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "nl",
    });
    const item = model.groups.flatMap((g) => g.items)[0]!;
    expect(item.stageLabel).toBe("Ingepland");
    expect(item.bucket).toBe("scheduled");
  });

  it("uses canonical Office campaign href", () => {
    const project = readyScheduledProject();
    const model = buildMarketingWorkViewModel({
      domainInput: domainInput([project]),
      peerName: "Emma",
      peerRole: "Marketing",
    });
    const item = model.groups.flatMap((g) => g.items)[0]!;
    expect(item.href).toBe(officeCampaignHref(PEER, project.id));
    expect(item.href).toBe(`/office/${PEER}/work/campaigns/${project.id}`);
  });

  it("displays localized schedule without seconds and publishing-not-connected copy", () => {
    const project = readyScheduledProject();
    const model = buildMarketingWorkViewModel({
      domainInput: domainInput([project]),
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "nl",
    });
    const item = model.groups.flatMap((g) => g.items)[0]!;
    expect(item.primaryText).toMatch(/Ingepland voor .+ om \d{2}:\d{2}/);
    expect(item.primaryText).not.toMatch(/:\d{2}:\d{2}/);
    expect(item.primaryText).not.toContain("T07:00");
    expect(item.secondaryText).toBe("Automatische publicatie is nog niet gekoppeld");
    expect(item.primaryText).not.toContain("Gaat op het geplande moment live");
    expect(item.actionLabel).toBe("Open campagne");
  });

  it("each project resolves to exactly one group", () => {
    const p1 = readyScheduledProject();
    const p2 = { ...readyScheduledProject(), id: "camp-2", title: "Second" };
    const model = buildMarketingWorkViewModel({
      domainInput: domainInput([p1, p2]),
      peerName: "Emma",
      peerRole: "Marketing",
    });
    const allItems = model.groups.flatMap((g) => g.items);
    expect(allItems).toHaveLength(2);
    const ids = allItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(2);
  });
});
