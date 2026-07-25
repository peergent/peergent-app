import { describe, expect, it } from "vitest";
import { transitionWorkUnit, createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import { createMarketingProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildProjectExperience } from "@/lib/peer-experience/marketing/projects/build-project-experience";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";

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

describe("buildProjectExperience", () => {
  it("shows live creating activity when generating on this project", () => {
    const project = createMarketingProject({
      peerId,
      title: "Instagram Campaign",
      goal: "Summer sale",
      channel: "Instagram",
      deliverableKind: "instagram",
      rawRequest: "Instagram campaign",
      ownerLabel: "You",
    });
    let unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: project.title,
      deliverableKind: "instagram",
      channel: "Instagram",
      objective: "Summer sale",
      audience: null,
      needsVisual: true,
      recurrence: "once",
      rawRequest: project.rawRequest,
    });
    unit = transitionWorkUnit(unit, "creating", "creation_started", "Creating");

    const exp = buildProjectExperience({
      ...baseInput,
      generating: "draft",
      generatingActivity: "Carousel post",
      activeWorkUnitId: unit.id,
      project,
      performanceHref: "/performance",
      contentItems: [],
      workUnits: [unit],
    });

    expect(exp.hero.isLive).toBe(true);
    expect(exp.hero.currentActivity).toContain("generating carousel visuals");
    expect(exp.hero.phase).toBe("creating");
    expect(exp.hero.estimatedCompletion).toBe("A few minutes");
  });

  it("uses review hero when waiting for approval", () => {
    const project = createMarketingProject({
      peerId,
      title: "Newsletter",
      goal: "July update",
      channel: "email",
      deliverableKind: "newsletter",
      rawRequest: "Newsletter",
      ownerLabel: "You",
    });
    const unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: project.title,
      deliverableKind: "newsletter",
      channel: "Email",
      objective: null,
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: project.rawRequest,
      draftId: "d1",
    });
    const draft: MarketingContentDraft = {
      id: "d1",
      planActivityReference: "NL",
      contentType: "newsletter",
      channel: "email",
      status: "ready_for_review",
      title: "July newsletter",
      body: "Hello",
      objective: "",
      keywords: [],
      rationale: { why: "", planActivityReference: "NL", strategyLinks: [] },
      sourceReferences: [],
      confidence: "high",
      warnings: [],
      generatedAt: new Date().toISOString(),
    };
    const reviewUnit = { ...unit, status: "review_ready" as const, draftId: "d1" };

    const exp = buildProjectExperience({
      ...baseInput,
      project,
      reviewHref: "/review",
      performanceHref: "/performance",
      contentItems: [],
      workUnits: [reviewUnit],
      drafts: [draft],
      connections: [{ id: "email", label: "Email", status: "connected", settingsHref: "/integrations", lastSyncedAt: null }],
    });

    expect(exp.hero.phase).toBe("review");
    expect(exp.hero.priority).toBe("needs_you");
    expect(exp.hero.primaryCta?.label).toBe("Review now");
    expect(exp.nextStep.label).toBe("Review and approve");
  });

  it("renders Emma-voice timeline messages", () => {
    const project = createMarketingProject({
      peerId,
      title: "SEO Audit",
      goal: "Rankings",
      channel: "seo",
      deliverableKind: "generic",
      rawRequest: "SEO",
      ownerLabel: "You",
    });

    const exp = buildProjectExperience({
      ...baseInput,
      project,
      performanceHref: "/performance",
      contentItems: [],
    });

    expect(exp.timeline[0]?.message).toBe("I started working on your campaign.");
    expect(exp.conversation.length).toBeGreaterThan(0);
    expect(exp.conversation[0]?.message).toContain("started working");
  });

  it("explains monitoring without fabricating analytics", () => {
    const project = createMarketingProject({
      peerId,
      title: "Instagram Campaign",
      goal: "Reach",
      channel: "Instagram",
      deliverableKind: "instagram",
      rawRequest: "IG",
      ownerLabel: "You",
    });
    const unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: project.title,
      deliverableKind: "instagram",
      channel: "Instagram",
      objective: null,
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: project.rawRequest,
      draftId: "d-pub",
    });
    const publishedUnit = { ...unit, status: "monitoring" as const, draftId: "d-pub" };
    const draft: MarketingContentDraft = {
      id: "d-pub",
      planActivityReference: "IG",
      contentType: "social_media_post",
      channel: "instagram",
      status: "published",
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

    const exp = buildProjectExperience({
      ...baseInput,
      project,
      performanceHref: "/performance",
      contentItems: [],
      workUnits: [publishedUnit],
      drafts: [draft],
    });

    expect(exp.hero.phase).toBe("monitoring");
    expect(exp.monitoring?.hasLiveData).toBe(false);
    expect(exp.monitoring?.dataUnavailableReason).toBeTruthy();
  });

  it("shows blocker when channel not connected at review", () => {
    const project = createMarketingProject({
      peerId,
      title: "Instagram Campaign",
      goal: "Launch",
      channel: "Instagram",
      deliverableKind: "instagram",
      rawRequest: "IG",
      ownerLabel: "You",
    });
    const unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: project.title,
      deliverableKind: "instagram",
      channel: "Instagram",
      objective: null,
      audience: null,
      needsVisual: true,
      recurrence: "once",
      rawRequest: project.rawRequest,
      draftId: "d-ig",
    });
    const draft: MarketingContentDraft = {
      id: "d-ig",
      planActivityReference: "IG",
      contentType: "social_media_post",
      channel: "instagram",
      status: "ready_for_review",
      title: "Post",
      body: "Hello",
      objective: "",
      keywords: [],
      rationale: { why: "", planActivityReference: "IG", strategyLinks: [] },
      sourceReferences: [],
      confidence: "high",
      warnings: [],
      generatedAt: new Date().toISOString(),
    };

    const exp = buildProjectExperience({
      ...baseInput,
      project,
      performanceHref: "/performance",
      contentItems: [],
      workUnits: [{ ...unit, status: "review_ready" as const, draftId: "d-ig" }],
      drafts: [draft],
      connections: [],
    });

    expect(exp.nextStep.blocked).toBe(true);
    expect(exp.nextStep.blockerReason).toContain("connection");
  });
});
