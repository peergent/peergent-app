import { describe, expect, it } from "vitest";
import {
  buildMarketingDeliverableViewModel,
  resolveSelectedTimelineNodeId,
} from "@/lib/peer-experience/marketing/build-marketing-deliverable-view-model";
import {
  buildMarketingTimelineNodes,
  contentTimelineNodeId,
  milestoneTimelineNodeId,
} from "@/lib/marketing-workspace/timeline-nodes";
import type {
  MarketingContentDraft,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";

const understanding: MarketingUnderstanding = {
  available: true,
  sparse: false,
  completeness: 80,
  gaps: [],
  brand: {
    values: [],
    toneOfVoice: {},
    keyMessages: [],
    positioningStatement: "We help SMBs grow.",
  },
  products: [{ id: "1", name: "Platform" }],
  services: [],
  customerSegments: [{ id: "1", name: "SMB", painPoints: [], buyingTriggers: [] }],
  competitors: [],
  goals: [],
  existingContent: [],
  assembledAt: "",
};

const strategy = {
  summary: "Strategy summary",
  targetAudiences: [],
  contentPillars: [],
  confidence: "high",
} as never;

const plan = {
  summary: "Plan summary",
  confidence: "high",
  contentCalendar: [
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      scheduledWeek: 1,
      rationale: { why: "Launch" },
      linkedStrategyItems: [],
      estimatedEffort: "medium",
      expectedImpact: "high",
    },
  ],
  campaigns: [{ name: "Launch" }],
} as never;

import type { PublicationPackage } from "@/lib/peer-workflow";

function buildInput(options?: {
  drafts?: MarketingContentDraft[];
  publicationPackages?: PublicationPackage[];
  selectedNodeId?: string | null;
  generating?: "draft" | null;
  generatingActivity?: string;
}) {
  const snapshot = buildMarketingTimelineNodes({
    generating: options?.generating ?? null,
    generatingActivity: options?.generatingActivity,
    understanding,
    strategy,
    plan,
    drafts: options?.drafts ?? [],
    publicationPackages: options?.publicationPackages ?? [],
  });

  const selectedNodeId = resolveSelectedTimelineNodeId(
    snapshot,
    options?.selectedNodeId ?? null
  );

  return {
    generating: options?.generating ?? null,
    generatingActivity: options?.generatingActivity,
    understanding,
    strategy,
    plan,
    drafts: options?.drafts ?? [],
    publicationPackages: options?.publicationPackages ?? [],
    snapshot,
    selectedNodeId,
  };
}

describe("buildMarketingDeliverableViewModel", () => {
  it("maps empty content node when no draft exists", () => {
    const deliverable = buildMarketingDeliverableViewModel(
      buildInput({ selectedNodeId: contentTimelineNodeId("LinkedIn launch post") })
    );
    expect(deliverable.kind).toBe("empty");
    if (deliverable.kind === "empty") {
      expect(deliverable.title).toContain("LinkedIn launch post");
      expect(deliverable.message).toContain("hasn't been written");
    }
  });

  it("maps document variant for strategy milestone", () => {
    const deliverable = buildMarketingDeliverableViewModel(
      buildInput({ selectedNodeId: milestoneTimelineNodeId("strategy") })
    );
    expect(deliverable.kind).toBe("document");
    if (deliverable.kind === "document") {
      expect(deliverable.documentType).toBe("strategy");
      expect(deliverable.summary).toContain("Strategy summary");
    }
  });

  it("maps reviewable content variant", () => {
    const draft = {
      id: "d1",
      title: "LinkedIn launch post",
      status: "draft",
      planActivityReference: "LinkedIn launch post",
      contentType: "linkedin_post",
      body: "Draft body",
      rationale: { why: "Launch awareness" },
    } as MarketingContentDraft;

    const deliverable = buildMarketingDeliverableViewModel(
      buildInput({
        drafts: [draft],
        selectedNodeId: contentTimelineNodeId("LinkedIn launch post"),
      })
    );

    expect(deliverable.kind).toBe("content");
    if (deliverable.kind === "content") {
      expect(deliverable.reviewable).toBe(true);
      expect(deliverable.body).toBe("Draft body");
      expect(deliverable.reviewStatusLabel).toBe("Awaiting your review");
    }
  });

  it("maps publish preview for ready_to_publish draft", () => {
    const draft = {
      id: "d1",
      title: "LinkedIn launch post",
      status: "ready_to_publish",
      planActivityReference: "LinkedIn launch post",
      contentType: "linkedin_post",
      body: "Final body",
      rationale: { why: "Launch" },
    } as MarketingContentDraft;

    const deliverable = buildMarketingDeliverableViewModel(
      buildInput({
        drafts: [draft],
        publicationPackages: [
          {
            id: "pub-1",
            channel: "linkedin",
            draftId: "d1",
            activityReference: "LinkedIn launch post",
            title: "LinkedIn launch post",
            body: "Final body",
            channelPayload: {
              format: "linkedin_post",
              text: "Final body",
              callToAction: null,
              hashtags: [],
            },
            status: "ready",
            preparedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        selectedNodeId: contentTimelineNodeId("LinkedIn launch post"),
      })
    );

    expect(deliverable.kind).toBe("publish-preview");
    if (deliverable.kind === "publish-preview") {
      expect(deliverable.previewBody).toContain("Final body");
      expect(deliverable.copyText).not.toContain("{");
    }
  });

  it("maps complete variant for published draft", () => {
    const draft = {
      id: "d1",
      title: "LinkedIn launch post",
      status: "published",
      planActivityReference: "LinkedIn launch post",
      contentType: "linkedin_post",
      body: "Live body",
      rationale: { why: "Launch" },
    } as MarketingContentDraft;

    const deliverable = buildMarketingDeliverableViewModel(
      buildInput({
        drafts: [draft],
        publicationPackages: [
          {
            id: "pub-1",
            channel: "linkedin",
            draftId: "d1",
            activityReference: "LinkedIn launch post",
            title: "LinkedIn launch post",
            body: "Live body",
            channelPayload: { format: "linkedin_post", text: "Live body" },
            status: "published",
            preparedAt: "2026-01-01T00:00:00.000Z",
            publishedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
        selectedNodeId: contentTimelineNodeId("LinkedIn launch post"),
      })
    );

    expect(deliverable.kind).toBe("complete");
    if (deliverable.kind === "complete") {
      expect(deliverable.completedAt).toBeDefined();
    }
  });

  it("falls back to current node when selection is invalid", () => {
    const input = buildInput({ selectedNodeId: "content:ghost" });
    expect(input.selectedNodeId).toBe(input.snapshot.currentNodeId);
  });
});
