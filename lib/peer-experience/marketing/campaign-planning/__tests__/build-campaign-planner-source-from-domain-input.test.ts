import { describe, expect, it } from "vitest";

import type { MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { createMarketingCampaignProject, createMarketingProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  toCreateMarketingCampaignProjectInput,
  createEmptyCreateCampaignForm,
} from "@/features/marketing-workspace/lib/create-campaign-form";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import { buildCampaignPlannerSourceFromDomainInput } from "../build-campaign-planner-source-from-domain-input";
import {
  CampaignPlanningArchivedProjectError,
  CampaignPlanningInvalidScopeError,
  CampaignPlanningMissingProjectError,
} from "../errors";

const assembledAt = "2026-07-20T12:00:00.000Z";

function sampleWorkUnit(overrides: Partial<WorkUnit> & Pick<WorkUnit, "id" | "projectId" | "title">): WorkUnit {
  return {
    peerId: "peer-emma",
    role: "Marketing",
    status: "planning",
    deliverableKind: "generic",
    channel: "LinkedIn",
    objective: null,
    audience: null,
    needsVisual: false,
    recurrence: "once",
    automationTrigger: null,
    draftId: null,
    planActivityReference: null,
    rawRequest: "x",
    startedAt: assembledAt,
    updatedAt: assembledAt,
    estimatedCompletionAt: null,
    artifacts: [],
    eventLog: [],
    paused: false,
    cancelled: false,
    ...overrides,
  };
}

const sampleStrategy: MarketingStrategy = {
  summary: "Inbound for SMB founders.",
  confidence: "high",
  confidenceReason: "Ok",
  targetAudiences: [{ segment: "SMB founders", priority: "primary", rationale: { why: "ICP", basedOn: [] } }],
  positioningRecommendations: [],
  contentPillars: [],
  campaignIdeas: [],
  seoOpportunities: [],
  socialMediaStrategy: [{ platform: "LinkedIn", approach: "Thought leadership", contentFocus: [], rationale: { why: "Reach", basedOn: [] } }],
  customerJourneyRecommendations: [],
  leadGenerationOpportunities: [],
  marketingPriorities: [],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

const samplePlan: MarketingPlan = {
  summary: "Q3 launch plan",
  confidence: "moderate",
  confidenceReason: "Ok",
  basedOnStrategySummary: "Inbound",
  objectives: [],
  priorities: [],
  timeline: [],
  campaigns: [],
  contentCalendar: [
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
      scheduledWeek: 2,
      rationale: { why: "Launch" },
      linkedStrategyItems: [],
      estimatedEffort: "medium",
      expectedImpact: "high",
    },
    {
      title: "Unrelated newsletter",
      contentType: "newsletter",
      channel: "Email",
      scheduledWeek: 4,
      rationale: { why: "Other" },
      linkedStrategyItems: [],
      estimatedEffort: "low",
      expectedImpact: "medium",
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

function baseInput(overrides: Partial<MarketingPeerDomainInput> = {}): MarketingPeerDomainInput {
  return {
    peerId: "peer-emma",
    organizationId: "org-1",
    userName: "Alex",
    peerName: "Emma",
    campaignTitle: "Campaign",
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: sampleStrategy,
    plan: samplePlan,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits: [],
    projects: [],
    responsibilities: [],
    automations: [],
    connections: [],
    ...overrides,
  };
}

function wizardProject() {
  return createMarketingCampaignProject(
    toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
      ...createEmptyCreateCampaignForm(),
      name: "Summer launch",
      description: "Grow signups",
      primaryGoalId: "generate_leads",
      targetAudience: "Founders",
      approvalMode: "approval_before_publication",
    })
  );
}

describe("buildCampaignPlannerSourceFromDomainInput", () => {
  it("builds source for a real campaign-wizard project", () => {
    const project = wizardProject();
    const input = baseInput({ projects: [project] });
    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: input,
      assembledAt,
    });
    expect(source.campaign.id).toBe(project.id);
    expect(source.organizationId).toBe("org-1");
    expect(source.peerId).toBe("peer-emma");
    expect(source.campaign.name).toBe("Summer launch");
    expect(source.strategySummary?.summary).toContain("Inbound");
    expect(source.scopeNotes?.some((n) => n.kind === "uncertainty")).toBe(true);
  });

  it("maps campaignSetup through campaign projection", () => {
    const project = wizardProject();
    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: baseInput({ projects: [project] }),
      assembledAt,
    });
    expect(source.campaign.audience.targetAudience).toContain("Founders");
    expect(source.campaign.execution.approvalMode).toBe("approval_before_publication");
    expect(source.scopeNotes?.some((n) => n.id === "evidence-campaign-setup")).toBe(true);
  });

  it("handles manual assignment conservatively without work units", () => {
    const project = createMarketingProject({
      peerId: "peer-emma",
      title: "Manual task",
      goal: "Goal",
      channel: "LinkedIn",
      deliverableKind: "linkedin",
      rawRequest: "Do something",
      ownerLabel: "Alex",
      origin: "manual_assignment",
    });
    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: baseInput({ projects: [project] }),
      assembledAt,
    });
    expect(source.strategySummary).toBeUndefined();
    expect(source.planSummary).toBeUndefined();
    expect(source.explicitDeliverables).toBeUndefined();
    expect(source.scopeNotes?.some((n) => n.id === "evidence-manual-conservative")).toBe(true);
  });

  it("rejects missing project", () => {
    expect(() =>
      buildCampaignPlannerSourceFromDomainInput({
        projectId: "missing",
        domainInput: baseInput(),
        assembledAt,
      })
    ).toThrow(CampaignPlanningMissingProjectError);
  });

  it("rejects archived project", () => {
    const project = wizardProject();
    project.archivedAt = assembledAt;
    expect(() =>
      buildCampaignPlannerSourceFromDomainInput({
        projectId: project.id,
        domainInput: baseInput({ projects: [project] }),
        assembledAt,
      })
    ).toThrow(CampaignPlanningArchivedProjectError);
  });

  it("rejects peer scope mismatch", () => {
    const project = wizardProject();
    expect(() =>
      buildCampaignPlannerSourceFromDomainInput({
        projectId: project.id,
        domainInput: baseInput({ projects: [project], peerId: "peer-other" }),
        assembledAt,
      })
    ).toThrow(CampaignPlanningInvalidScopeError);
  });

  it("marks peer-level strategy and plan as uncertain", () => {
    const project = wizardProject();
    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: baseInput({ projects: [project] }),
      assembledAt,
    });
    expect(source.scopeNotes?.some((n) => n.id === "uncertainty-peer-strategy")).toBe(true);
    expect(source.scopeNotes?.some((n) => n.id === "uncertainty-peer-plan")).toBe(true);
    expect(source.scopeNotes?.some((n) => n.id === "gap-plan-activities-unlinked")).toBe(true);
    expect(source.planSummary?.contentCalendar).toBeUndefined();
  });

  it("includes only plan activities linked by work units", () => {
    const project = wizardProject();
    const unit = sampleWorkUnit({
      id: "wu-1",
      projectId: project.id,
      title: "LinkedIn launch post",
      deliverableKind: "linkedin",
      channel: "LinkedIn",
      objective: "Launch",
      planActivityReference: "LinkedIn launch post",
    });

    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: baseInput({ projects: [project], workUnits: [unit] }),
      assembledAt,
    });
    expect(source.planSummary?.contentCalendar).toHaveLength(1);
    expect(source.planSummary?.contentCalendar?.[0]?.title).toBe("LinkedIn launch post");
    expect(source.explicitDeliverables?.[0]?.channel).toBe("LinkedIn");
    expect(source.existingWorkUnits).toHaveLength(1);
  });

  it("excludes work units from other projects", () => {
    const project = wizardProject();
    const other = wizardProject();
    const linked = sampleWorkUnit({
      id: "wu-linked",
      projectId: project.id,
      title: "Mine",
      channel: "LinkedIn",
    });
    const unrelated = sampleWorkUnit({
      id: "wu-other",
      projectId: other.id,
      title: "Other",
      channel: "Email",
    });

    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: baseInput({ projects: [project, other], workUnits: [linked, unrelated] }),
      assembledAt,
    });
    expect(source.existingWorkUnits).toHaveLength(1);
    expect(source.existingWorkUnits?.[0]?.id).toBe(linked.id);
    expect(source.explicitChannels).toEqual(["LinkedIn"]);
  });

  it("does not invent channels for wizard-only projects", () => {
    const project = wizardProject();
    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: baseInput({ projects: [project] }),
      assembledAt,
    });
    expect(source.explicitChannels).toBeUndefined();
    expect(source.explicitDeliverables).toBeUndefined();
    expect(source.scopeNotes?.some((n) => n.id === "gap-no-explicit-deliverables")).toBe(true);
  });

  it("maps responsibilities without inferring from titles", () => {
    const project = wizardProject();
    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: baseInput({
        projects: [project],
        responsibilities: [
          {
            id: "resp-1",
            peerId: "peer-emma",
            title: "LinkedIn Presence",
            description: "d",
            category: "linkedin",
            goal: "g",
            cadence: { type: "weekly" },
            autonomyLevel: "suggest",
            approvalPolicy: "approval_required",
            priority: 1,
            status: "enabled",
            enabled: true,
            guardrails: {},
            createdAt: assembledAt,
            updatedAt: assembledAt,
          },
        ],
      }),
      assembledAt,
    });
    expect(source.responsibilities?.[0]?.category).toBe("linkedin");
    expect(source.responsibilities?.[0]?.approvalPolicy).toBe("approval_required");
  });

  it("does not mutate domain input", () => {
    const project = wizardProject();
    const input = baseInput({ projects: [project] });
    const before = JSON.stringify(input);
    buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: input,
      assembledAt,
    });
    expect(JSON.stringify(input)).toBe(before);
  });
});
