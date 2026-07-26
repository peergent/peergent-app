import { describe, expect, it, vi } from "vitest";

import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";

import { executeMarketingWorkUnitInWorkspace } from "../execute-marketing-work-unit-workspace";

const peerId = "peer-1";
const organizationId = "org-1";

function domainInput(
  projects: MarketingPeerDomainInput["projects"],
  workUnits: MarketingPeerDomainInput["workUnits"]
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

describe("executeMarketingWorkUnitInWorkspace", () => {
  it("returns FeatureDisabled when campaign workspace flag is off", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: "Finalize campaign strategy",
      deliverableKind: "generic",
      channel: "Campaign",
      objective: "Strategy",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Strategy",
    });

    const result = await executeMarketingWorkUnitInWorkspace({
      workUnitId: unit.id,
      organizationId,
      userId: "user-1",
      domainInput: domainInput([project], [unit]),
      assembledAt: "2026-07-24T12:00:00.000Z",
      campaignWorkspaceEnabled: false,
      supabase: {} as import("@supabase/supabase-js").SupabaseClient,
      getWorkspaceSnapshot: () => ({ workUnits: [unit], strategy: null }),
      commitWorkspaceState: () => undefined,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("FeatureDisabled");
  });

  it("delegates to runtime when enabled with injected deps via executeMarketingWorkUnit", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: "LinkedIn post",
      deliverableKind: "linkedin",
      channel: "LinkedIn",
      objective: "Post",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Post",
    });

    const result = await executeMarketingWorkUnitInWorkspace({
      workUnitId: unit.id,
      organizationId,
      userId: "user-1",
      domainInput: domainInput([project], [unit]),
      assembledAt: "2026-07-24T12:00:00.000Z",
      campaignWorkspaceEnabled: true,
      supabase: {} as import("@supabase/supabase-js").SupabaseClient,
      getWorkspaceSnapshot: () => ({ workUnits: [unit], strategy: null }),
      commitWorkspaceState: vi.fn(),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("UnsupportedWorkUnit");
  });
});
