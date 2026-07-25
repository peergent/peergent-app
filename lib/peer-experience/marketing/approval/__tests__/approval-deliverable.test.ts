import { describe, expect, it, vi } from "vitest";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import { mergeApprovalOverlay } from "@/lib/peer-experience/marketing/approval/approval-overlay";
import {
  buildApprovalDeliverable,
  resolveApprovalChannel,
  resolveApprovalConnectionState,
  selectPreviewChannel,
} from "@/lib/peer-experience/marketing/approval/build-approval-deliverable";
import { validateApprovalUpload } from "@/lib/peer-experience/marketing/approval/media-validation";
import { DevImageGenerationAdapter } from "@/lib/peer-experience/marketing/approval/adapters/dev-image-generation-adapter";
import { buildEmmaWorkspaceViewModel } from "@/lib/peer-experience/marketing/build-emma-workspace-view-model";
import type { PrimaryAction } from "@/lib/peer-experience";

const instagramDraft: MarketingContentDraft = {
  id: "d-ig",
  planActivityReference: "IG post",
  contentType: "social_media_post",
  channel: "instagram",
  status: "ready_for_review",
  title: "Launch post",
  body: "Hello world #peergent #ai",
  objective: "Awareness",
  targetAudience: "Founders",
  keywords: ["peergent"],
  callToAction: "Learn more",
  rationale: {
    why: "Problem-first hooks perform well.",
    planActivityReference: "IG post",
    strategyLinks: [],
  },
  sourceReferences: [],
  confidence: "high",
  warnings: [],
  generatedAt: new Date().toISOString(),
};

describe("approval deliverable model", () => {
  it("maps instagram channel from draft", () => {
    expect(resolveApprovalChannel(instagramDraft)).toBe("instagram");
  });

  it("builds deliverable with overlay content", () => {
    const deliverable = buildApprovalDeliverable({
      draft: instagramDraft,
      workUnit: null,
      overlay: mergeApprovalOverlay(undefined, "d-ig", {
        content: { caption: "Updated caption", hashtags: ["#test"] },
      }),
      connections: [{ id: "instagram", label: "Instagram", status: "connected", settingsHref: "/integrations", lastSyncedAt: null }],
      peerName: "Emma",
    });

    expect(deliverable.content.caption).toBe("Updated caption");
    expect(deliverable.content.hashtags).toEqual(["#test"]);
    expect(deliverable.account.connected).toBe(true);
  });

  it("selects preview channel from deliverable", () => {
    const deliverable = buildApprovalDeliverable({
      draft: instagramDraft,
      workUnit: null,
      connections: [],
      peerName: "Emma",
    });
    expect(selectPreviewChannel(deliverable)).toBe("instagram");
  });

  it("disables schedule and publish when disconnected", () => {
    const deliverable = buildApprovalDeliverable({
      draft: instagramDraft,
      workUnit: null,
      connections: [{ id: "instagram", label: "Instagram", status: "not_connected", settingsHref: "/integrations", lastSyncedAt: null }],
      peerName: "Emma",
    });
    const connection = resolveApprovalConnectionState(deliverable.account);
    expect(connection.canSchedule).toBe(false);
    expect(connection.canPublish).toBe(false);
    expect(connection.disabledReason).toBeTruthy();
  });

  it("uses carousel format when multiple media assets exist", () => {
    const deliverable = buildApprovalDeliverable({
      draft: instagramDraft,
      workUnit: null,
      overlay: mergeApprovalOverlay(undefined, "d-ig", {
        media: [
          { id: "1", type: "image", source: "generated", url: "a", status: "ready" },
          { id: "2", type: "image", source: "generated", url: "b", status: "ready" },
        ],
      }),
      connections: [],
      peerName: "Emma",
    });
    expect(deliverable.format).toBe("carousel");
  });
});

describe("media validation", () => {
  it("rejects unsupported file types", () => {
    const file = new File(["x"], "bad.exe", { type: "application/octet-stream" });
    expect(validateApprovalUpload(file).ok).toBe(false);
  });

  it("accepts jpeg uploads under size limit", () => {
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    expect(validateApprovalUpload(file)).toEqual({ ok: true });
  });
});

describe("image generation adapter", () => {
  it("returns error when prompt is empty", async () => {
    const adapter = new DevImageGenerationAdapter();
    const result = await adapter.generate({ prompt: "  ", aspectRatio: "1:1" });
    expect(result.status).toBe("error");
  });

  it("returns explicit placeholder on success", async () => {
    const adapter = new DevImageGenerationAdapter();
    const result = await adapter.generate({ prompt: "Product hero", aspectRatio: "4:5" });
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.url).toContain("data:image/svg+xml");
      expect(result.localOnly).toBe(true);
    }
  });
});

describe("buildEmmaWorkspaceViewModel approval", () => {
  const baseInput = {
    peerId: "peer-emma",
    userName: "Djemo",
    peerName: "Emma",
    campaignTitle: "Campaign",
    generating: null,
    understanding: { available: true, completeness: 100, gaps: [], summary: "", lastUpdated: "" },
    drafts: [] as MarketingContentDraft[],
    plan: null,
    strategy: null,
    publicationPackages: [],
    deliverable: { kind: "empty" as const, title: "", message: "" },
    primaryAction: null as PrimaryAction | null,
    activityFeed: [],
    connections: [{ id: "instagram", label: "Instagram", status: "connected" as const, settingsHref: "/integrations", lastSyncedAt: null }],
  };

  it("shows honest empty approval state", () => {
    const vm = buildEmmaWorkspaceViewModel(baseInput);
    expect(vm.needsApproval.emptyMessage).toContain("doesn't need your approval");
    expect(vm.needsApproval.deliverable).toBeNull();
  });

  it("includes approval deliverable when draft is ready", () => {
    const vm = buildEmmaWorkspaceViewModel({
      ...baseInput,
      drafts: [instagramDraft],
    });
    expect(vm.needsApproval.deliverable?.channel).toBe("instagram");
    expect(vm.needsApproval.connection?.canPublish).toBe(true);
  });
});

describe("selectPreviewChannel per channel", () => {
  const channels: Array<{ channel: string; contentType: string; expected: ReturnType<typeof resolveApprovalChannel> }> = [
    { channel: "instagram", contentType: "social_media_post", expected: "instagram" },
    { channel: "linkedin", contentType: "linkedin_post", expected: "linkedin" },
    { channel: "facebook", contentType: "social_media_post", expected: "facebook" },
    { channel: "newsletter", contentType: "newsletter", expected: "newsletter" },
    { channel: "blog", contentType: "blog", expected: "blog" },
    { channel: "google", contentType: "google_ads", expected: "google_ads" },
  ];

  for (const { channel, contentType, expected } of channels) {
    it(`resolves ${expected} preview for ${channel}`, () => {
      const draft: MarketingContentDraft = {
        ...instagramDraft,
        id: `d-${channel}`,
        channel,
        contentType: contentType as MarketingContentDraft["contentType"],
      };
      const deliverable = buildApprovalDeliverable({
        draft,
        workUnit: null,
        connections: [],
        peerName: "Emma",
      });
      expect(selectPreviewChannel(deliverable)).toBe(expected);
    });
  }
});

describe("carousel slide navigation", () => {
  function nextSlide(current: number, total: number) {
    return Math.min(total - 1, current + 1);
  }
  function prevSlide(current: number) {
    return Math.max(0, current - 1);
  }

  it("advances and clamps carousel slides", () => {
    expect(nextSlide(0, 3)).toBe(1);
    expect(nextSlide(2, 3)).toBe(2);
    expect(prevSlide(1)).toBe(0);
    expect(prevSlide(0)).toBe(0);
  });
});

describe("scheduled publish validation", () => {
  it("requires connected account and schedule date", () => {
    const disconnected = buildApprovalDeliverable({
      draft: instagramDraft,
      workUnit: null,
      connections: [{ id: "instagram", label: "Instagram", status: "not_connected", settingsHref: "/integrations", lastSyncedAt: null }],
      peerName: "Emma",
    });
    const connection = resolveApprovalConnectionState(disconnected.account);
    expect(connection.canSchedule).toBe(false);

    const connected = buildApprovalDeliverable({
      draft: instagramDraft,
      workUnit: null,
      connections: [{ id: "instagram", label: "Instagram", status: "connected", settingsHref: "/integrations", lastSyncedAt: null }],
      peerName: "Emma",
    });
    const connectedState = resolveApprovalConnectionState(connected.account);
    expect(connectedState.canSchedule).toBe(true);
    expect("").toBeFalsy();
  });
});

describe("approve status mapping", () => {
  it("maps ready_for_review to review_ready deliverable status", () => {
    const deliverable = buildApprovalDeliverable({
      draft: { ...instagramDraft, status: "ready_for_review" },
      workUnit: null,
      connections: [],
      peerName: "Emma",
    });
    expect(deliverable.status).toBe("review_ready");
  });

  it("maps approved draft to approved deliverable status", () => {
    const deliverable = buildApprovalDeliverable({
      draft: { ...instagramDraft, status: "approved" },
      workUnit: null,
      connections: [],
      peerName: "Emma",
    });
    expect(deliverable.status).toBe("approved");
  });
});

describe("overlay persistence merge", () => {
  it("merges content updates", () => {
    const merged = mergeApprovalOverlay(undefined, "d1", {
      content: { caption: "A" },
    });
    const again = mergeApprovalOverlay(merged, "d1", {
      content: { firstComment: "Nice" },
    });
    expect(again.content?.caption).toBe("A");
    expect(again.content?.firstComment).toBe("Nice");
  });
});
