import { describe, expect, it } from "vitest";

import {
  isActionableOptionalImprovement,
  presentCustomerWorkItemTitle,
  shouldIncludePackageInCustomerPlan,
} from "@/features/marketing-workspace/lib/campaign-execution-plan-customer-presenter";
import { presentCampaignExecutionPlan } from "@/features/marketing-workspace/lib/campaign-execution-plan-presenter";
import type { CampaignWorkPackage } from "@/lib/campaign/planner/types";
import type { CampaignExecutionPlan } from "@/lib/campaign/planner";

function contentPkg(overrides: Partial<CampaignWorkPackage>): CampaignWorkPackage {
  return {
    id: "pkg-1",
    type: "content_creation",
    title: "LinkedIn deliverable",
    description: "d",
    status: "proposed",
    priority: 60,
    phase: "production",
    dependencies: [],
    recommendedOwner: { role: "copywriter" },
    estimatedEffort: "high",
    approvalRequirement: { required: false },
    channel: "LinkedIn",
    deliverableType: "social_post",
    sourceReferences: [],
    blockers: [],
    completionCriteria: "",
    ...overrides,
  };
}

describe("campaign execution plan customer presentation", () => {
  it("hides generic channel placeholder deliverables", () => {
    expect(
      shouldIncludePackageInCustomerPlan(
        contentPkg({ deliverableType: "generic", title: "LinkedIn deliverable" }),
        {}
      )
    ).toBe(false);
  });

  it("filters channels outside customer selection", () => {
    expect(
      shouldIncludePackageInCustomerPlan(
        contentPkg({ channel: "Instagram" }),
        { allowedChannelLabels: new Set(["LinkedIn", "Email", "Campaign"]) }
      )
    ).toBe(false);
  });

  it("uses customer-facing deliverable titles", () => {
    expect(
      presentCustomerWorkItemTitle(
        contentPkg({ deliverableType: "social_post", channel: "LinkedIn" })
      )
    ).toBe("LinkedIn content");
    expect(
      presentCustomerWorkItemTitle(
        contentPkg({ deliverableType: "email", channel: "Email", title: "Email deliverable" })
      )
    ).toBe("Email campaign");
  });

  it("drops compatibility warnings from optional improvements", () => {
    expect(
      isActionableOptionalImprovement("Social post is not planned for Email — choose a match.")
    ).toBe(false);
    expect(
      isActionableOptionalImprovement(
        "A fuller marketing strategy can sharpen messaging when you add it to your workspace."
      )
    ).toBe(true);
  });

  it("omits setup pairing scope notes from the view model", () => {
    const vm = presentCampaignExecutionPlan({
      plan: {
        id: "p1",
        campaignId: "c1",
        organizationId: "org",
        version: 1,
        status: "ready",
        objective: "Grow",
        workPackages: [],
        executionOrder: [],
        approvals: [],
        gaps: [],
        evidence: [],
        assembledAt: "2026-07-24T12:00:00.000Z",
      } as CampaignExecutionPlan,
      scopeNotes: [
        {
          id: "setup-pairing-1",
          kind: "uncertainty",
          message: "Social post is not planned for Email — choose a matching channel.",
        },
      ],
    });
    expect(vm.optionalImprovements).toHaveLength(0);
  });
});
