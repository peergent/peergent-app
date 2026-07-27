import { describe, expect, it } from "vitest";

import { compareArtifactSections } from "../compare-artifact-sections";
import { extractComparableSections } from "../extract-comparable-sections";
import { buildCampaignPublishReadinessViewModel } from "../build-publish-readiness";
import { decisionForVersion } from "../campaign-collaboration-labels";
import type { CampaignReviewItem } from "../../campaign-review/campaign-review-types";

describe("campaign collaboration read models", () => {
  it("compares sections semantically", () => {
    const result = compareArtifactSections({
      workUnitId: "wu-1",
      fromVersion: 1,
      toVersion: 2,
      oldSections: [{ id: "cta", label: "CTA", value: "Book a demo" }],
      newSections: [{ id: "cta", label: "CTA", value: "Schedule your AI strategy session" }],
      priorContentAvailable: true,
    });
    expect(result.sections[0]?.change).toBe("changed");
    expect(result.sections[0]?.oldValue).toBe("Book a demo");
    expect(result.sections[0]?.newValue).toBe("Schedule your AI strategy session");
  });

  it("extracts comparable sections from strategy preview", () => {
    const sections = extractComparableSections({
      kind: "campaign_strategy",
      strategyTitle: "Scale",
      summary: "Summary",
      positioning: "Pos",
      messagingPillars: ["One"],
      recommendedChannels: ["LinkedIn"],
      ctaGuidance: "Book",
    });
    expect(sections.some((s) => s.id === "cta")).toBe(true);
  });

  it("resolves decision for artifact version from history", () => {
    const decision = decisionForVersion(
      [
        {
          id: "d1",
          artifactVersion: 1,
          decision: "changes_requested",
          decidedAt: "2026-01-02T00:00:00.000Z",
        } as never,
        {
          id: "d2",
          artifactVersion: 2,
          decision: "approved",
          decidedAt: "2026-01-03T00:00:00.000Z",
        } as never,
      ],
      2
    );
    expect(decision?.id).toBe("d2");
  });

  it("marks readiness waiting for review when queue items exist", () => {
    const item = {
      inReviewQueue: true,
      preview: {},
      status: "awaiting_review",
      decisionStatus: "awaiting_review",
    } as CampaignReviewItem;
    const vm = buildCampaignPublishReadinessViewModel({
      reviewItems: [item],
      buildInput: {
        peerId: "p",
        peerName: "Marketing",
        projectId: "proj",
        project: {} as never,
        workUnits: [],
        reviewItems: [item],
        strategy: null,
        approvalMode: "approval_before_generation",
      },
    });
    expect(vm.status).toBe("waiting_for_review");
  });
});
