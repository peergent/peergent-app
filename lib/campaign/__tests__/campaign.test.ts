import { describe, expect, it } from "vitest";

import {
  CAMPAIGN_IDENTITY_FIELDS,
  CAMPAIGN_OWNED_MODULES,
  CAMPAIGN_REQUIRED_SECTIONS,
} from "../ownership";
import type { Campaign, CampaignWorker } from "../types";
import {
  CAMPAIGN_WORKFORCE_ROLE_LABELS,
  CAMPAIGN_WORKFORCE_ROLES,
} from "../types";

function buildWorkforceWorkers(): CampaignWorker[] {
  return CAMPAIGN_WORKFORCE_ROLES.map((role) => ({
    role,
    displayName: CAMPAIGN_WORKFORCE_ROLE_LABELS[role],
    status: role === "campaign_planner" ? "in_progress" : "idle",
    responsibility: `Own ${CAMPAIGN_WORKFORCE_ROLE_LABELS[role]} deliverables for this campaign.`,
    completion: role === "campaign_planner" ? 35 : 0,
  }));
}

export const FIXTURE_CAMPAIGN: Campaign = {
  id: "campaign-1",
  organizationId: "org-1",
  name: "Q3 Product launch",
  description: "Coordinated launch across LinkedIn, email, and paid social.",
  version: 1,
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-15T14:00:00.000Z",
  goal: {
    businessObjective: "Increase qualified pipeline by 20%.",
    marketingObjective: "Establish category leadership for AI workforce OS.",
    successMetrics: [
      { id: "mql", label: "Marketing qualified leads", target: "120", unit: "count" },
      { id: "sql", label: "Sales qualified leads", target: "40", unit: "count" },
    ],
  },
  audience: {
    targetAudience: "Mid-market operations and revenue leaders",
    personas: [
      { id: "p-ops", name: "Ops leader", description: "Owns team efficiency" },
      { id: "p-rev", name: "Rev leader", description: "Owns pipeline targets" },
    ],
    segments: [
      { id: "seg-1", label: "200–500 employee B2B SaaS" },
      { id: "seg-2", label: "Series B growth teams" },
    ],
  },
  execution: {
    channels: [
      { channelId: "linkedin", label: "LinkedIn organic + advocacy" },
      { channelId: "email", label: "Lifecycle nurture" },
      { channelId: "paid_social", label: "Retargeting" },
    ],
    timeline: {
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      milestones: [
        { id: "ms-1", label: "Briefs approved", dueDate: "2026-07-15" },
        { id: "ms-2", label: "Launch week", dueDate: "2026-08-01" },
      ],
    },
    status: "active",
    budget: { currency: "USD", allocated: 25000, spent: 4200 },
    approvalMode: "approval_before_publication",
  },
  references: {
    marketingDecisionIds: ["md-decision-1"],
    creativeBriefIds: ["brief-linkedin-1", "brief-email-1"],
    generatedContentIds: ["content-draft-101"],
    assetIds: ["asset-logo-primary", "asset-hero-ui"],
  },
  performance: {
    kpiPlaceholders: [
      {
        id: "kpi-ctr",
        name: "CTR",
        description: "Placeholder until performance brain wiring",
        targetValue: "2.5%",
      },
    ],
    progress: {
      percentComplete: 42,
      summary: "Planning complete; copy and design in flight.",
      updatedAt: "2026-07-15T14:00:00.000Z",
    },
    recommendations: [
      {
        id: "rec-1",
        summary: "Add one more LinkedIn variant before launch week.",
        priority: "high",
      },
    ],
  },
  workforce: {
    workers: buildWorkforceWorkers(),
  },
};

describe("campaign types", () => {
  it("includes identity fields and every required section on the fixture", () => {
    for (const field of CAMPAIGN_IDENTITY_FIELDS) {
      if (field === "description") {
        expect(FIXTURE_CAMPAIGN.description).toBeDefined();
      } else {
        expect(FIXTURE_CAMPAIGN).toHaveProperty(field);
      }
    }
    for (const section of CAMPAIGN_REQUIRED_SECTIONS) {
      expect(FIXTURE_CAMPAIGN).toHaveProperty(section);
    }
    expect(CAMPAIGN_REQUIRED_SECTIONS).toHaveLength(CAMPAIGN_OWNED_MODULES.length);
  });

  it("serializes and deserializes without losing structure", () => {
    const roundTrip = JSON.parse(JSON.stringify(FIXTURE_CAMPAIGN)) as Campaign;
    expect(roundTrip).toEqual(FIXTURE_CAMPAIGN);
    expect(roundTrip.goal.successMetrics).toHaveLength(2);
    expect(roundTrip.references.creativeBriefIds).toContain("brief-linkedin-1");
    expect(roundTrip.execution.timeline.milestones[0]?.label).toBe("Briefs approved");
  });

  it("preserves nested readonly collections through serialization", () => {
    const serialized = JSON.stringify(FIXTURE_CAMPAIGN);
    const parsed = JSON.parse(serialized) as Campaign;

    expect(parsed.audience.personas.map((p) => p.name)).toEqual([
      "Ops leader",
      "Rev leader",
    ]);
    expect(parsed.performance.recommendations[0]?.priority).toBe("high");
  });

  it("does not embed excluded dependency domains in the campaign shape", () => {
    const keys = Object.keys(FIXTURE_CAMPAIGN);
    expect(keys).not.toContain("brandBrain");
    expect(keys).not.toContain("businessBrain");
    expect(keys).not.toContain("creativeBrief");
    expect(keys).not.toContain("marketingDecision");
    expect(keys).not.toContain("publishing");
    expect(keys).not.toContain("renderer");
  });

  it("stores only reference ids — not decision, brief, content, or asset payloads", () => {
    expect(FIXTURE_CAMPAIGN.references.marketingDecisionIds).toEqual(["md-decision-1"]);
    expect(typeof FIXTURE_CAMPAIGN.references.marketingDecisionIds[0]).toBe("string");
    expect(FIXTURE_CAMPAIGN.references.assetIds.every((id) => typeof id === "string")).toBe(
      true
    );
  });

  it("defines a six-role AI workforce with status, responsibility, and completion", () => {
    expect(CAMPAIGN_WORKFORCE_ROLES).toHaveLength(6);
    expect(FIXTURE_CAMPAIGN.workforce.workers).toHaveLength(6);

    for (const role of CAMPAIGN_WORKFORCE_ROLES) {
      const worker = FIXTURE_CAMPAIGN.workforce.workers.find((w) => w.role === role);
      expect(worker).toBeDefined();
      expect(worker!.displayName).toBe(CAMPAIGN_WORKFORCE_ROLE_LABELS[role]);
      expect(worker!.responsibility.length).toBeGreaterThan(0);
      expect(worker!.completion).toBeGreaterThanOrEqual(0);
      expect(worker!.completion).toBeLessThanOrEqual(100);
      expect(["idle", "assigned", "in_progress", "blocked", "complete"]).toContain(
        worker!.status
      );
    }
  });
});
