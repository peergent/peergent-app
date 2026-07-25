import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { PublicationPackage } from "@/lib/peer-workflow";
import {
  loadMarketingWorkspaceState,
  patchMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";
import { buildMarketingActivityLifecycleMap } from "@/lib/marketing-workspace/activity-lifecycle";
import { prependActivity, createActivity } from "@/lib/marketing-workspace/experience/activity-feed";

const peerId = "peer-publication-persistence";

const baseDraft: MarketingContentDraft = {
  id: "draft-1",
  planActivityReference: "Blog slot",
  contentType: "blog_article",
  objective: "SEO",
  title: "Blog title",
  body: "Blog body",
  keywords: ["ai"],
  rationale: {
    why: "SEO",
    planActivityReference: "Blog slot",
    strategyLinks: [],
  },
  sourceReferences: [],
  confidence: "high",
  status: "approved",
  warnings: [],
  generatedAt: "2026-01-01T00:00:00.000Z",
};

const readyPackage: PublicationPackage = {
  id: "pub-draft-1-website_cms",
  channel: "website_cms",
  draftId: "draft-1",
  activityReference: "Blog slot",
  title: "Blog title",
  body: "Blog body",
  channelPayload: { format: "cms_article" },
  status: "ready",
  preparedAt: "2026-01-01T00:00:00.000Z",
};

describe("publication workflow persistence", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves published draft and package when a later patch only updates activityFeed", () => {
    const publishedDraft: MarketingContentDraft = {
      ...baseDraft,
      status: "published",
    };
    const publishedPackage: PublicationPackage = {
      ...readyPackage,
      status: "published",
      publishedAt: "2026-01-02T00:00:00.000Z",
    };

    patchMarketingWorkspaceState(peerId, {
      drafts: [publishedDraft],
      publicationPackages: [publishedPackage],
      activityFeed: [],
      conversation: [],
    });

    const feedAfterMark = prependActivity(
      [],
      createActivity(
        "published",
        "Marked as published",
        `"${publishedDraft.title}" was confirmed published.`,
        { relatedObject: publishedDraft.title }
      )
    );

    patchMarketingWorkspaceState(peerId, { activityFeed: feedAfterMark });

    const restored = loadMarketingWorkspaceState(peerId);
    expect(restored.drafts[0]?.status).toBe("published");
    expect(restored.publicationPackages?.[0]?.status).toBe("published");
    expect(restored.activityFeed).toHaveLength(1);
  });

  it("survives the full Draft → Approved → Ready to Publish → Published refresh cycle", () => {
    patchMarketingWorkspaceState(peerId, {
      drafts: [{ ...baseDraft, status: "draft" }],
      publicationPackages: [],
      activityFeed: [],
      conversation: [],
    });

    patchMarketingWorkspaceState(peerId, {
      drafts: [{ ...baseDraft, status: "approved" }],
    });
    patchMarketingWorkspaceState(peerId, {
      activityFeed: prependActivity(
        [],
        createActivity("draft_approved", "Draft approved", "Approved")
      ),
    });

    patchMarketingWorkspaceState(peerId, {
      drafts: [{ ...baseDraft, status: "ready_to_publish" }],
      publicationPackages: [readyPackage],
    });
    patchMarketingWorkspaceState(peerId, {
      activityFeed: prependActivity(
        loadMarketingWorkspaceState(peerId).activityFeed ?? [],
        createActivity("publication_ready", "Ready to publish", "Ready")
      ),
    });

    patchMarketingWorkspaceState(peerId, {
      drafts: [{ ...baseDraft, status: "published" }],
      publicationPackages: [
        {
          ...readyPackage,
          status: "published",
          publishedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
    patchMarketingWorkspaceState(peerId, {
      activityFeed: prependActivity(
        loadMarketingWorkspaceState(peerId).activityFeed ?? [],
        createActivity("published", "Marked as published", "Published")
      ),
    });

    const restored = loadMarketingWorkspaceState(peerId);
    expect(restored.drafts[0]?.status).toBe("published");
    expect(restored.publicationPackages?.[0]?.status).toBe("published");

    const lifecycle = buildMarketingActivityLifecycleMap({
      plan: {
        summary: "Plan",
        confidence: "high",
        confidenceReason: "ok",
        basedOnStrategySummary: "Strategy",
        objectives: [],
        priorities: [],
        timeline: [],
        campaigns: [],
        contentCalendar: [
          {
            title: "Blog slot",
            contentType: "blog_article",
            scheduledWeek: 1,
            rationale: { why: "SEO" },
            linkedStrategyItems: [],
            estimatedEffort: "medium",
            expectedImpact: "high",
          },
        ],
        dependencies: [],
        expectedOutcomes: [],
        successMetrics: [],
        knowledgeGaps: [],
        generatedAt: "",
      },
      drafts: restored.drafts,
      publicationPackages: restored.publicationPackages ?? [],
    });

    expect(["published", "completed"]).toContain(lifecycle.get("blog slot"));
  });
});
