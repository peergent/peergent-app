import { describe, expect, it } from "vitest";
import type { MarketingContentDraft, MarketingStrategy } from "@/lib/marketing-intelligence";
import type { ActivityFeedItem } from "@/lib/marketing-workspace";
import {
  getContentHref,
  getPerformanceHref,
  getPerformanceInsightsHref,
  getReviewHref,
  getSettingsHref,
  getWorkHref,
  parseReviewSearchParams,
  resolveActiveMarketingPeerTab,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { buildMarketingOverviewViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-overview-view-model";
import { buildMarketingResultMetrics } from "@/lib/peer-experience/marketing/view-models/build-marketing-result-metrics";
import {
  buildMarketingBrainInsights,
  isActivityFeedInsight,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-brain-insights";
import { buildMarketingMorningBrief } from "@/lib/peer-experience/marketing/view-models/build-marketing-morning-brief";
import { buildMarketingReviewViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-review-view-model";
import {
  buildMarketingContentDetailViewModel,
  buildMarketingContentViewModel,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-content-view-model";
import { buildMarketingAutomationViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-automation-view-model";
import {
  buildMarketingActivities,
  buildMarketingApprovalQueue,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import { buildUpcomingMarketingTasks } from "@/lib/peer-experience/marketing/view-models/build-marketing-upcoming-work";
import { buildMarketingPerformanceViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-performance-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

const peerId = "peer-emma";

const baseInput: MarketingPeerDomainInput = {
  peerId,
  userName: "Djemo",
  peerName: "Emma",
  campaignTitle: "Campaign",
  generating: null,
  generatingActivity: null,
  understanding: { available: true, completeness: 80, gaps: [], summary: "", lastUpdated: "" },
  strategy: null,
  plan: null,
  drafts: [],
  publicationPackages: [],
  activityFeed: [],
  workUnits: [],
  projects: [],
  responsibilities: [],
  automations: [],
  connections: [],
};

const instagramDraft: MarketingContentDraft = {
  id: "d-ig",
  planActivityReference: "IG",
  contentType: "social_media_post",
  channel: "instagram",
  status: "ready_for_review",
  title: "Launch post",
  body: "Hello",
  objective: "",
  keywords: [],
  rationale: { why: "", planActivityReference: "IG", strategyLinks: [] },
  sourceReferences: [],
  confidence: "high",
  warnings: [],
  generatedAt: new Date().toISOString(),
};

const strategy: MarketingStrategy = {
  id: "s1",
  organizationId: "org",
  peerId,
  positioning: "",
  targetAudiences: [],
  valuePropositions: [],
  messagingPillars: [],
  campaignIdeas: [{ name: "Q2 Launch", objective: "Drive signups", channels: ["linkedin"] }],
  seoOpportunities: [{ topic: "AI workforce", intent: "informational", priority: "high" }],
  contentThemes: [],
  channelRecommendations: [],
  risks: [],
  confidence: "high",
  generatedAt: new Date().toISOString(),
};

describe("marketing peer navigation", () => {
  it("resolves active tab per route", () => {
    expect(resolveActiveMarketingPeerTab(`/team/${peerId}`, peerId)).toBe("working_on");
    expect(resolveActiveMarketingPeerTab(`/team/${peerId}/connections`, peerId)).toBe(
      "settings"
    );
    expect(resolveActiveMarketingPeerTab(`/team/${peerId}/review`, peerId)).toBe(
      "waiting_for_me"
    );
    expect(resolveActiveMarketingPeerTab(`/team/${peerId}/responsibilities`, peerId)).toBe(
      "settings"
    );
    expect(
      resolveActiveMarketingPeerTab(`/team/${peerId}/responsibilities/resp-1`, peerId)
    ).toBe("settings");
  });

  it("builds deliverableId review deep links", () => {
    expect(getReviewHref(peerId, "d1")).toBe(`/team/${peerId}/waiting?deliverableId=d1`);
    expect(parseReviewSearchParams(new URLSearchParams("deliverableId=d1")).deliverableId).toBe("d1");
    expect(parseReviewSearchParams(new URLSearchParams("draft=d1")).deliverableId).toBe("d1");
  });

  it("builds workUnitId deep links", () => {
    expect(getWorkHref(peerId, "wu1")).toContain("workUnitId=wu1");
  });

  it("builds performance insights view href", () => {
    expect(getPerformanceInsightsHref(peerId)).toContain("view=insights");
  });
});

describe("buildMarketingResultMetrics", () => {
  it("uses setup_required with actionable CTA for reach", () => {
    const metrics = buildMarketingResultMetrics(baseInput);
    const reach = metrics.find((m) => m.id === "reach");
    expect(reach?.status).toBe("setup_required");
    expect(reach?.setupCta?.label).toBeTruthy();
    expect(reach?.setupCta?.href).toBeTruthy();
  });

  it("labels time saved as estimated from completed tasks", () => {
    const metrics = buildMarketingResultMetrics({
      ...baseInput,
      drafts: [{ ...instagramDraft, status: "published" }],
    });
    const timeSaved = metrics.find((m) => m.id === "time-saved");
    expect(timeSaved?.status).toBe("estimated");
    expect(timeSaved?.estimatedNote).toContain("completed task");
  });

  it("shows live integration metric when stored", () => {
    const metrics = buildMarketingResultMetrics({
      ...baseInput,
      storedMetrics: [
        {
          id: "m1",
          peerId,
          provider: "google_analytics",
          metricKey: "reach",
          label: "Reach",
          value: "1200",
          unit: null,
          periodStart: null,
          periodEnd: null,
          recordedAt: new Date().toISOString(),
        },
      ],
      connections: [{ id: "google_analytics", label: "GA", status: "connected", settingsHref: "/integrations", lastSyncedAt: null }],
    });
    const reach = metrics.find((m) => m.id === "reach");
    expect(reach?.status).toBe("live");
    expect(reach?.value).toBe("1200");
  });
});

describe("buildMarketingBrainInsights", () => {
  it("excludes activity feed events from brain", () => {
    expect(isActivityFeedInsight("ins-feed-abc")).toBe(true);
    const insights = buildMarketingBrainInsights({
      ...baseInput,
      strategy,
      activityFeed: [
        {
          id: "a1",
          timestamp: new Date().toISOString(),
          activityType: "draft_approved",
          title: "Approved post",
          description: "User approved",
        },
      ],
    });
    expect(insights.every((i) => !i.id.startsWith("ins-feed"))).toBe(true);
  });

  it("limits to 4 insights on overview", () => {
    const insights = buildMarketingBrainInsights({ ...baseInput, strategy });
    expect(insights.length).toBeLessThanOrEqual(4);
  });

  it("requires evidence for quantified stored metric insights", () => {
    const insights = buildMarketingBrainInsights({
      ...baseInput,
      storedMetrics: [
        {
          id: "m1",
          peerId,
          provider: "meta",
          metricKey: "reach",
          label: "Reach",
          value: "5000",
          unit: null,
          periodStart: null,
          periodEnd: null,
          recordedAt: new Date().toISOString(),
        },
      ],
    });
    const metricInsight = insights.find((i) => i.id.startsWith("brain-metric"));
    expect(metricInsight?.evidence?.currentValue).toBe("5000");
    expect(metricInsight?.actions[0]?.href).toContain("/results");
  });

  it("routes review action for needs approval insight", () => {
    const insights = buildMarketingBrainInsights({
      ...baseInput,
      drafts: [instagramDraft],
    });
    const approval = insights.find((i) => i.status === "needs_approval");
    expect(approval?.actions[0]?.href).toBe(getReviewHref(peerId, "d-ig"));
  });
});

describe("buildMarketingApprovalQueue", () => {
  it("limits to 3 attention items with deliverable links", () => {
    const drafts = Array.from({ length: 5 }, (_, i) => ({
      ...instagramDraft,
      id: `d-${i}`,
      title: `Post ${i}`,
    }));
    const items = buildMarketingApprovalQueue({ ...baseInput, drafts });
    expect(items).toHaveLength(3);
    expect(items[0]?.reviewHref).toContain("deliverableId=");
  });
});

describe("buildUpcomingMarketingTasks", () => {
  it("groups upcoming work by date label", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const project = {
      id: "proj-1",
      peerId,
      title: "Instagram carousel",
      goal: "Launch",
      campaignType: "instagram_campaign" as const,
      createdAt: new Date().toISOString(),
      updatedAt: tomorrow.toISOString(),
      ownerLabel: "You",
      rawRequest: "",
      archivedAt: null,
    };
    const groups = buildUpcomingMarketingTasks({
      ...baseInput,
      projects: [project],
      workUnits: [
        {
          id: "wu1",
          peerId,
          projectId: project.id,
          role: "Marketing",
          title: "Instagram carousel",
          status: "planning",
          deliverableKind: "instagram",
          channel: "instagram",
          objective: null,
          audience: null,
          needsVisual: true,
          recurrence: "once",
          automationTrigger: null,
          draftId: null,
          planActivityReference: null,
          rawRequest: "",
          startedAt: new Date().toISOString(),
          updatedAt: tomorrow.toISOString(),
          estimatedCompletionAt: tomorrow.toISOString(),
          artifacts: [],
          eventLog: [],
          paused: false,
          cancelled: false,
        },
      ],
    });
    expect(groups[0]?.dateLabel).toBe("Tomorrow");
    expect(groups[0]?.items[0]?.originLabel).toBe("Assigned by you");
    expect(groups[0]?.items[0]?.href).toContain("/projects/");
  });

  it("routes blocked integration to settings", () => {
    const groups = buildUpcomingMarketingTasks({
      ...baseInput,
      connections: [{ id: "instagram", label: "Instagram", status: "needs_reconnect", settingsHref: "/integrations", lastSyncedAt: null }],
    });
    const blocked = groups.flatMap((g) => g.items).find((i) => i.status === "blocked");
    expect(blocked?.href).toBe(getSettingsHref(peerId, "channels"));
  });
});

describe("buildMarketingActivities", () => {
  it("deep-links published content", () => {
    const items = buildMarketingActivities({
      ...baseInput,
      drafts: [{ ...instagramDraft, status: "published", title: "Fast Deployment" }],
    });
    expect(items[0]?.target.href).toBe(getContentHref(peerId, "d-ig"));
    expect(items[0]?.actionLabel).toBe("Open Project");
  });

  it("deep-links project from feed when matched", () => {
    const project = {
      id: "proj-seo",
      peerId,
      title: "SEO audit",
      goal: "Audit",
      campaignType: "seo_audit" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerLabel: "You",
      rawRequest: "",
      archivedAt: null,
    };
    const items = buildMarketingActivities({
      ...baseInput,
      projects: [project],
      activityFeed: [
        {
          id: "act1",
          timestamp: new Date().toISOString(),
          activityType: "publication_prepared",
          title: "Prepared publication",
          description: "SEO audit",
          relatedObject: "SEO audit",
        },
      ],
      workUnits: [
        {
          id: "wu-seo",
          peerId,
          projectId: project.id,
          role: "Marketing",
          title: "SEO audit",
          status: "scheduled",
          deliverableKind: "generic",
          channel: "seo",
          objective: null,
          audience: null,
          needsVisual: false,
          recurrence: "once",
          automationTrigger: null,
          draftId: null,
          planActivityReference: "SEO audit",
          rawRequest: "",
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedCompletionAt: null,
          artifacts: [],
          eventLog: [],
          paused: false,
          cancelled: false,
        },
      ],
    });
    expect(items[0]?.target.href).toContain(`/projects/${project.id}`);
    expect(items[0]?.actionLabel).toBe("Open Project");
  });
});

describe("buildMarketingMorningBrief", () => {
  it("uses contextual approval copy", () => {
    const brief = buildMarketingMorningBrief({
      ...baseInput,
      drafts: [{ ...instagramDraft, channel: "linkedin", contentType: "linkedin_post" }],
    });
    expect(brief.highlights.some((h) => h.text.includes("waiting for your approval"))).toBe(true);
    expect(brief.highlights.length).toBeLessThanOrEqual(5);
  });

  it("avoids duplicate highlights", () => {
    const brief = buildMarketingMorningBrief({
      ...baseInput,
      drafts: [instagramDraft, instagramDraft],
    });
    const texts = brief.highlights.map((h) => h.text);
    expect(new Set(texts).size).toBe(texts.length);
  });
});

describe("buildMarketingOverviewViewModel", () => {
  it("renders all required sections with updated empty states", () => {
    const vm = buildMarketingOverviewViewModel(baseInput);
    expect(vm.attention.emptyMessage).toContain("doesn't need anything");
    expect(vm.brain.viewAllHref).toContain("view=insights");
  });
});

describe("content detail and performance filters", () => {
  it("content detail performance CTA uses contentId filter", () => {
    const detail = buildMarketingContentDetailViewModel({
      ...baseInput,
      drafts: [instagramDraft],
      contentId: "d-ig",
    });
    expect(detail?.performanceHref).toContain("contentId=d-ig");
  });

  it("performance view model scopes contentId", () => {
    const vm = buildMarketingPerformanceViewModel({
      ...baseInput,
      filters: { contentId: "d-ig" },
      drafts: [instagramDraft],
    });
    expect(vm.contentScope.contentId).toBe("d-ig");
    expect(vm.contentScope.title).toBe("Launch post");
  });
});

describe("buildMarketingReviewViewModel", () => {
  it("includes deliverable for selected draft", () => {
    const vm = buildMarketingReviewViewModel({
      ...baseInput,
      drafts: [instagramDraft],
      selectedDraftId: "d-ig",
    });
    expect(vm.selectedDeliverable?.channel).toBe("instagram");
  });
});

describe("buildMarketingAutomationViewModel", () => {
  it("exposes responsibility autonomy states", () => {
    const vm = buildMarketingAutomationViewModel(baseInput);
    expect(vm.responsibilities.length).toBeGreaterThan(0);
  });
});
