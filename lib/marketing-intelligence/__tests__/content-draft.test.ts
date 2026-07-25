import { describe, expect, it } from "vitest";
import { assessContentDraftReadiness } from "@/lib/marketing-intelligence/content/assess-content-readiness";
import {
  detectUngroundedClaims,
  parseMarketingContentDraft,
} from "@/lib/marketing-intelligence/content/parse-marketing-content-draft";
import {
  isDraftablePlanActivity,
  isSupportedContentType,
  normalizeContentType,
  resolveContentCalendarActivity,
} from "@/lib/marketing-intelligence/content/resolve-plan-activity";
import type { MarketingPlan } from "@/lib/marketing-intelligence";
import type { ContextPackage } from "@/lib/intelligence";

const activityBase = {
  rationale: { why: "Supports founder playbook campaign." },
  linkedStrategyItems: [{ type: "campaignIdea" as const, reference: "Founder playbook" }],
  estimatedEffort: "medium" as const,
  expectedImpact: "high" as const,
};

const samplePlan: MarketingPlan = {
  summary: "12-week plan",
  confidence: "high",
  confidenceReason: "Clear strategy",
  basedOnStrategySummary: "Inbound focus",
  objectives: [],
  priorities: [],
  timeline: [],
  campaigns: [],
  contentCalendar: [
    {
      title: "Founder pain points slot",
      contentType: "blog_article",
      channel: "Blog",
      scheduledWeek: 6,
      pillar: "Growth efficiency",
      ...activityBase,
    },
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
      scheduledWeek: 5,
      ...activityBase,
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: "2026-01-01T00:00:00.000Z",
};

const minimalContextPackage = {
  scope: { peer: { role: "Marketing" } },
  slices: {
    companyDna: { available: true, values: [], toneOfVoice: { summary: "Confident" } },
    businessBrain: {
      available: true,
      products: [{ id: "p1", name: "Platform", metadata: {}, sortOrder: 0 }],
      services: [],
      customerSegments: [],
      competitors: [],
      internalProcesses: [],
      knowledgeSources: [],
      facts: [],
    },
    marketingUnderstanding: {
      roleApplicable: true,
      available: true,
      sparse: false,
      completeness: 80,
      gaps: [],
      brand: { values: [], toneOfVoice: {}, keyMessages: [] },
      products: [{ id: "p1", name: "Platform" }],
      services: [],
      customerSegments: [{ id: "s1", name: "SMB founders", painPoints: [], buyingTriggers: [] }],
      competitors: [],
      goals: [],
      existingContent: [],
      assembledAt: "",
    },
  },
  meta: { warnings: [] },
} as unknown as ContextPackage;

const validDraftJson = {
  planActivityReference: "Founder pain points slot",
  contentType: "blog_article",
  channel: "Blog",
  objective: "Educate SMB founders on pain points",
  targetAudience: "SMB founders",
  title: "Why founders struggle with growth efficiency",
  body: "Growing teams face mounting operational pressure. Our Platform helps teams scale without adding headcount.",
  callToAction: "Learn how Peergent helps",
  keywords: ["founders", "growth", "efficiency"],
  rationale: { why: "Implements week 6 blog slot from the content calendar." },
  sourceReferences: [
    { source: "marketing-plan", reference: "Founder pain points slot" },
    { source: "business-brain", reference: "Platform product" },
    { source: "company-dna", reference: "Confident tone" },
  ],
  confidence: "high",
  status: "draft",
};

describe("normalizeContentType", () => {
  it("maps blog_post to blog_article", () => {
    expect(normalizeContentType("blog_post")).toBe("blog_article");
  });

  it("maps human-readable Blog Post labels to blog_article", () => {
    expect(normalizeContentType("Blog Post")).toBe("blog_article");
  });

  it("returns null for unsupported types", () => {
    expect(normalizeContentType("podcast_episode")).toBeNull();
    expect(normalizeContentType("Webinar")).toBeNull();
    expect(isSupportedContentType("podcast_episode")).toBe(false);
    expect(isSupportedContentType("Webinar")).toBe(false);
  });

  it("marks webinar plan activities as not draftable", () => {
    expect(
      isDraftablePlanActivity({
        contentType: "Webinar" as MarketingPlan["contentCalendar"][number]["contentType"],
      })
    ).toBe(false);
  });
});

describe("resolveContentCalendarActivity", () => {
  it("resolves activity by title", () => {
    const resolved = resolveContentCalendarActivity(samplePlan, "Founder pain points slot");
    expect(resolved?.activity.title).toBe("Founder pain points slot");
    expect(resolved?.normalizedContentType).toBe("blog_article");
  });

  it("returns null for missing activity", () => {
    expect(resolveContentCalendarActivity(samplePlan, "Nonexistent")).toBeNull();
  });

  it("returns null for unsupported content type on activity", () => {
    const planWithBadType: MarketingPlan = {
      ...samplePlan,
      contentCalendar: [
        { title: "Podcast ep 1", contentType: "podcast" as unknown as MarketingPlan["contentCalendar"][number]["contentType"], scheduledWeek: 1, ...activityBase },
      ],
    };
    expect(resolveContentCalendarActivity(planWithBadType, "Podcast ep 1")).toBeNull();
  });
});

describe("assessContentDraftReadiness", () => {
  it("requires planActivityReference", () => {
    const result = assessContentDraftReadiness(samplePlan, undefined, minimalContextPackage);
    expect(result.ready).toBe(false);
  });

  it("rejects missing plan activity", () => {
    const result = assessContentDraftReadiness(
      samplePlan,
      "Missing activity",
      minimalContextPackage
    );
    expect(result.ready).toBe(false);
  });

  it("accepts valid plan activity", () => {
    const result = assessContentDraftReadiness(
      samplePlan,
      "Founder pain points slot",
      minimalContextPackage
    );
    expect(result.ready).toBe(true);
    expect(result.normalizedContentType).toBe("blog_article");
  });

  it("accepts valid plan activity with human-readable content type labels", () => {
    const planWithLabel: MarketingPlan = {
      ...samplePlan,
      contentCalendar: [
        {
          title: "Educational Blog Post: AI Employees vs AI Tools",
          contentType: "blog_article",
          channel: "Blog",
          scheduledWeek: 3,
          pillar: "Education",
          ...activityBase,
        },
      ],
    };

    const result = assessContentDraftReadiness(
      planWithLabel,
      "Educational Blog Post: AI Employees vs AI Tools",
      minimalContextPackage
    );
    expect(result.ready).toBe(true);
    expect(result.normalizedContentType).toBe("blog_article");
  });

  it("accepts legacy plan activities stored with Blog Post labels", () => {
    const legacyPlan: MarketingPlan = {
      ...samplePlan,
      contentCalendar: [
        {
          title: "Educational Blog Post: AI Employees vs AI Tools",
          contentType: "Blog Post" as unknown as MarketingPlan["contentCalendar"][number]["contentType"],
          channel: "Blog",
          scheduledWeek: 3,
          ...activityBase,
        },
      ],
    };

    const result = assessContentDraftReadiness(
      legacyPlan,
      "Educational Blog Post: AI Employees vs AI Tools",
      minimalContextPackage
    );
    expect(result.ready).toBe(true);
    expect(result.normalizedContentType).toBe("blog_article");
  });
});

describe("detectUngroundedClaims", () => {
  const knownProducts = ["Platform", "Analytics platform"];
  const knownServices = ["Onboarding"];

  it("flags unknown product references", () => {
    const warnings = detectUngroundedClaims("Try our SuperWidget today.", knownProducts, []);
    expect(warnings.some((w) => w.includes("SuperWidget"))).toBe(true);
  });

  it("flags invented multi-word product names", () => {
    const warnings = detectUngroundedClaims(
      "Deploy our GrowthEngine across your stack. Try our LeadPilot solution.",
      knownProducts,
      knownServices
    );
    expect(warnings.some((w) => w.includes("GrowthEngine"))).toBe(true);
    expect(warnings.some((w) => w.includes("LeadPilot"))).toBe(true);
  });

  it("allows known product references", () => {
    const warnings = detectUngroundedClaims("Our Platform helps teams.", knownProducts, []);
    expect(warnings).toHaveLength(0);
  });

  it("allows grounded multi-word product names from Business Brain", () => {
    const warnings = detectUngroundedClaims(
      "See how our Analytics platform supports inbound teams.",
      knownProducts,
      knownServices
    );
    expect(warnings).toHaveLength(0);
  });

  it("allows grounded service references", () => {
    const warnings = detectUngroundedClaims(
      "Book our Onboarding program to get started.",
      knownProducts,
      knownServices
    );
    expect(warnings).toHaveLength(0);
  });

  it("does not warn on generic multi-word CTA phrases", () => {
    const samples = [
      "Contact our team for a personalized walkthrough of AI employees.",
      "Our company can help your team scale efficiently.",
      "Our solution is designed for growth-stage founders.",
      "Our platform team is ready to support your rollout.",
      "Reach out to our service team for onboarding support.",
    ];

    for (const text of samples) {
      const warnings = detectUngroundedClaims(text, knownProducts, knownServices);
      expect(warnings).toHaveLength(0);
    }
  });

  it("does not warn when the full captured phrase is a generic term", () => {
    const warnings = detectUngroundedClaims("Our product is built for teams.", knownProducts, []);
    expect(warnings).toHaveLength(0);
  });
});

describe("parseMarketingContentDraft", () => {
  const parseOptions = {
    expectedPlanActivityReference: "Founder pain points slot",
    normalizedContentType: "blog_article" as const,
    strategyLinks: activityBase.linkedStrategyItems,
    validationContext: {
      expectedPlanActivityReference: "Founder pain points slot",
      knownProductNames: ["Platform"],
      knownServiceNames: [],
      knownAudienceNames: ["SMB founders"],
    },
    draftId: "draft-test-1",
  };

  it("parses valid draft JSON", () => {
    const result = parseMarketingContentDraft(JSON.stringify(validDraftJson), parseOptions);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.draft.id).toBe("draft-test-1");
    expect(result.draft.status).toBe("draft");
    expect(result.draft.planActivityReference).toBe("Founder pain points slot");
    expect(result.draft.rationale.strategyLinks[0]?.reference).toBe("Founder playbook");
  });

  it("rejects plan activity reference mismatch", () => {
    const invalid = { ...validDraftJson, planActivityReference: "Wrong activity" };
    const result = parseMarketingContentDraft(JSON.stringify(invalid), parseOptions);
    expect(result.success).toBe(false);
  });

  it("rejects unsupported content type in output", () => {
    const invalid = { ...validDraftJson, contentType: "podcast_episode" };
    const result = parseMarketingContentDraft(JSON.stringify(invalid), parseOptions);
    expect(result.success).toBe(false);
  });

  it("rejects invalid JSON", () => {
    const result = parseMarketingContentDraft("not json", parseOptions);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const invalid = { ...validDraftJson, body: "" };
    const result = parseMarketingContentDraft(JSON.stringify(invalid), parseOptions);
    expect(result.success).toBe(false);
  });

  it("forces status to draft even if AI returns approved", () => {
    const withApproved = { ...validDraftJson, status: "approved" };
    const result = parseMarketingContentDraft(JSON.stringify(withApproved), parseOptions);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.draft.status).toBe("draft");
    }
  });
});
