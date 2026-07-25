import { describe, expect, it } from "vitest";
import {
  buildMarketingActivityLifecycleMap,
  findNextMarketingPlanActivity,
  isPlanExecutionComplete,
} from "@/lib/marketing-workspace/activity-lifecycle";
import { prepareDraftForPublication } from "@/lib/marketing-workspace/publication-service";
import type { MarketingContentDraft, MarketingPlan } from "@/lib/marketing-intelligence";

const plan: MarketingPlan = {
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
    {
      title: "LinkedIn slot",
      contentType: "linkedin_post",
      scheduledWeek: 2,
      rationale: { why: "Awareness" },
      linkedStrategyItems: [],
      estimatedEffort: "low",
      expectedImpact: "medium",
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: "",
};

const blogDraft: MarketingContentDraft = {
  id: "draft-blog",
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
  generatedAt: "",
};

describe("marketing activity lifecycle", () => {
  it("derives approved lifecycle for approved drafts", () => {
    const map = buildMarketingActivityLifecycleMap({
      plan,
      drafts: [blogDraft],
      publicationPackages: [],
    });
    expect(map.get("blog slot")).toBe("approved");
  });

  it("derives ready_to_publish after publication package is prepared", () => {
    const pkg = prepareDraftForPublication(blogDraft);
    const readyDraft = { ...blogDraft, status: "ready_to_publish" as const };
    const map = buildMarketingActivityLifecycleMap({
      plan,
      drafts: [readyDraft],
      publicationPackages: [pkg],
    });
    expect(map.get("blog slot")).toBe("ready_to_publish");
  });

  it("finds the next undrafted calendar activity", () => {
    const map = buildMarketingActivityLifecycleMap({
      plan,
      drafts: [blogDraft],
      publicationPackages: [],
    });
    const next = findNextMarketingPlanActivity(plan, map);
    expect(next?.title).toBe("LinkedIn slot");
  });

  it("marks plan complete when all draftable activities are published", () => {
    const publishedBlog = { ...blogDraft, status: "published" as const };
    const linkedInDraft: MarketingContentDraft = {
      ...blogDraft,
      id: "draft-li",
      planActivityReference: "LinkedIn slot",
      contentType: "linkedin_post",
      status: "published",
    };
    const packages = [
      prepareDraftForPublication(publishedBlog),
      prepareDraftForPublication(linkedInDraft),
    ].map((pkg) => ({ ...pkg, status: "published" as const, publishedAt: new Date().toISOString() }));

    const map = buildMarketingActivityLifecycleMap({
      plan,
      drafts: [publishedBlog, linkedInDraft],
      publicationPackages: packages,
    });

    expect(isPlanExecutionComplete(plan, map)).toBe(true);
    expect(map.get("blog slot")).toBe("completed");
    expect(map.get("linkedin slot")).toBe("completed");
  });
});
