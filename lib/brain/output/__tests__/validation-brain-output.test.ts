import { describe, expect, it } from "vitest";
import { buildDemoCampaignBrainOutput } from "@/lib/brain/output/demo/demo-brain-output";
import { resolveBrainPresentationContext } from "@/lib/brain/output/presentation-context";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { mapCampaignExperienceFromBrain } from "@/lib/office/brain-output/map-campaign-experience";
import { buildCampaignBrainOutput } from "@/lib/brain/output/aggregate/build-campaign-brain-output";
import { publicationReadinessLabel } from "@/lib/brain/output/publish/validation-source";
import { publishValidationQualitySummary } from "@/lib/brain/output/publish/validation-quality-summary";
import { publishValidationExecutiveApprovals, publishValidationRequiredFixes } from "@/lib/brain/output/publish/validation-approvals";
import { publishValidationActivityEvents } from "@/lib/brain/output/publish/validation-activity";
import type { ValidationGraph, ValidationReport } from "@/lib/brain/layers/validation/types";
import { mapValidationGraphToBrainOutput } from "@/lib/brain/layers/validation/map-validation-graph-to-output";
import { buildDemoCreativeGraph } from "@/lib/brain/output/demo/demo-creative-graph";
import { mapCreativeGraphToBrainOutput } from "@/lib/brain/layers/creative/map-creative-graph-to-output";

function mockValidationGraph(readiness: ValidationReport["publicationReadiness"], score = 92): ValidationGraph {
  const categories = [
    { id: "brand_consistency" as const, label: "Brand", status: "pass" as const, score: { value: 90, max: 100, label: "excellent" as const }, summary: "OK", evaluatedAt: "2026-08-01T00:00:00.000Z" },
    { id: "audience_fit" as const, label: "Audience", status: "pass" as const, score: { value: 88, max: 100, label: "excellent" as const }, summary: "OK", evaluatedAt: "2026-08-01T00:00:00.000Z" },
    { id: "legal_claims" as const, label: "Claims", status: readiness === "READY_WITH_SUGGESTIONS" ? ("warning" as const) : readiness === "BLOCKED" ? ("fail" as const) : ("pass" as const), score: { value: 70, max: 100, label: "good" as const }, summary: "OK", evaluatedAt: "2026-08-01T00:00:00.000Z" },
  ];

  const issues =
    readiness === "BLOCKED"
      ? [{
          id: "issue-1",
          category: "cta_quality" as const,
          severity: "critical" as const,
          reason: "Landing page CTA is unclear.",
          businessImpact: "Likely conversion loss.",
          suggestedResolution: "Revise the CTA before validation runs again.",
          blocking: true,
          deliverableId: "del-landing",
        }]
      : [];

  const warnings =
    readiness === "READY_WITH_SUGGESTIONS"
      ? [{
          id: "warn-1",
          category: "legal_claims" as const,
          reason: "The term 'market-leading' should be supported before reuse.",
          businessImpact: "Trust may drop after ad click.",
          suggestedResolution: "Add delivery proof before increasing spend.",
        }]
      : [];

  const report: ValidationReport = {
    version: "1.0.0",
    organizationId: "org",
    campaignId: "camp",
    createdAt: "2026-08-01T00:00:00.000Z",
    overallScore: { value: score, max: 100, label: "excellent" },
    publicationReadiness: readiness,
    categories,
    issues,
    warnings,
    passes: [],
    requiredFixes: issues.map((i) => ({ issueId: i.id, category: i.category, summary: i.reason, blocking: i.blocking })),
    optionalImprovements: warnings.map((w) => ({ warningId: w.id, category: w.category, summary: w.reason, expectedImpact: w.businessImpact })),
    businessRisks: warnings.length
      ? [{ id: "risk-1", category: "legal_claims" as const, risk: "Speed claim lacks landing page proof.", severity: "medium" as const, mitigation: "Add delivery proof before increasing spend." }]
      : [],
    brandRisks: [],
    approvedDeliverables: [{ id: "dec-1", deliverableId: "del-1", deliverableType: "linkedin_post", channel: "linkedin", approved: true, reason: "Meets threshold." }],
    rejectedDeliverables: issues.length
      ? [{ id: "dec-2", deliverableId: "del-landing", deliverableType: "landing_page", channel: "landing_page", approved: false, reason: "Blocked." }]
      : [],
    reasoningSummary: "Validation complete.",
    confidence: "high",
    estimatedQuality: { value: score, max: 100, label: "excellent" },
    estimatedConversion: { value: 80, max: 100, label: "good" },
  };

  return {
    version: "1.0.0",
    organizationId: "org",
    campaignId: "camp",
    createdAt: "2026-08-01T00:00:00.000Z",
    creativeGraphRef: "creative:org:camp",
    report,
    phases: categories.map((c) => ({ domain: c.id, completedAt: c.evaluatedAt, summary: c.summary, status: c.status, issueCount: 0 })),
    confidence: "high",
  };
}

function buildBrainWithValidation(readiness: ValidationReport["publicationReadiness"]) {
  const domainInput = buildDemoDomainInput({ locale: "en" });
  const project = domainInput.projects[0]!;
  const ctx = {
    ...resolveBrainPresentationContext({ peerId: "demo", locale: "en", isDemo: true }),
    project,
    domainInput,
    campaignContext: buildCampaignContext({ project, domainInput, locale: "en" }),
  };

  const creativeGraph = buildDemoCreativeGraph({
    organizationId: ctx.campaignContext.companyName,
    campaignId: project.id,
    nl: false,
    now: "2026-08-01T00:00:00.000Z",
  });

  const validationGraph = mockValidationGraph(readiness);

  return buildCampaignBrainOutput({
    ctx,
    outputs: {
      creative_generation: mapCreativeGraphToBrainOutput({ graph: creativeGraph, campaignContext: ctx.campaignContext, locale: "en" }),
      validation: mapValidationGraphToBrainOutput({ graph: validationGraph, campaignContext: ctx.campaignContext, locale: "en" }),
    },
    briefing: null,
    workflowSteps: [],
    statusLabel: "In review",
  });
}

describe("Validation Brain Output Layer", () => {
  it("translates READY readiness to customer language", () => {
    expect(publicationReadinessLabel("READY", false)).toBe("Ready");
    const summary = publishValidationQualitySummary({ validation: mockValidationGraph("READY"), nl: false });
    expect(summary?.readinessLabel).toBe("Ready");
  });

  it("translates READY_WITH_SUGGESTIONS readiness", () => {
    expect(publicationReadinessLabel("READY_WITH_SUGGESTIONS", false)).toBe("Ready · suggestions available");
  });

  it("translates CHANGES_REQUIRED readiness", () => {
    expect(publicationReadinessLabel("CHANGES_REQUIRED", false)).toBe("Revision required");
  });

  it("translates BLOCKED readiness", () => {
    expect(publicationReadinessLabel("BLOCKED", false)).toBe("Publication blocked");
  });

  it("produces validation-aware approval explanation", () => {
    const approvals = publishValidationExecutiveApprovals({
      validation: mockValidationGraph("READY_WITH_SUGGESTIONS"),
      nl: false,
    });
    expect(approvals[0]?.reason).toMatch(/Emma reviewed the campaign/i);
    expect(approvals[0]?.reason).toMatch(/92\/100/);
    expect(approvals[0]?.reason).toMatch(/market-leading/i);
  });

  it("surfaces required fixes when blocked — no approval", () => {
    const brain = buildBrainWithValidation("BLOCKED");
    expect(brain.publicationBlocked).toBe(true);
    expect(brain.executiveApprovals).toHaveLength(0);
    expect(brain.requiredFixes.length).toBeGreaterThan(0);
    expect(brain.requiredFixes[0]?.title).toMatch(/CTA is unclear/i);

    const slices = mapCampaignExperienceFromBrain({ brain, nl: false });
    expect(slices.recommendation?.headline).toBe("Publication blocked");
    expect(slices.recommendation?.primaryLabel).not.toMatch(/approve/i);
  });

  it("integrates validation into campaign progress", () => {
    const brain = buildBrainWithValidation("READY_WITH_SUGGESTIONS");
    const validationStep = brain.progress.steps.find((s) => s.id === "validation");
    expect(validationStep?.label).toMatch(/92\/100/);
    expect(validationStep?.narrative).toMatch(/Quality review completed/i);
  });

  it("filters validation activity to meaningful milestones only", () => {
    const events = publishValidationActivityEvents({
      validation: mockValidationGraph("READY_WITH_SUGGESTIONS"),
      nl: false,
      now: new Date("2026-08-01T01:00:00.000Z"),
    });
    expect(events.length).toBeLessThanOrEqual(6);
    expect(events.some((e) => e.title.match(/Quality review started/i))).toBe(true);
    expect(events.some((e) => e.title.match(/Ready for approval/i))).toBe(true);
    expect(events.every((e) => !e.title.match(/business_fit|legal_claims/i))).toBe(true);
  });

  it("does not fabricate validation when graph missing", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const project = domainInput.projects[0]!;
    const ctx = {
      ...resolveBrainPresentationContext({ peerId: "demo", locale: "en", isDemo: true }),
      project,
      domainInput,
      campaignContext: buildCampaignContext({ project, domainInput, locale: "en" }),
    };

    const creativeGraph = buildDemoCreativeGraph({
      organizationId: ctx.campaignContext.companyName,
      campaignId: project.id,
      nl: false,
      now: "2026-08-01T00:00:00.000Z",
    });

    const brain = buildCampaignBrainOutput({
      ctx,
      outputs: {
        creative_generation: mapCreativeGraphToBrainOutput({ graph: creativeGraph, campaignContext: ctx.campaignContext, locale: "en" }),
      },
      briefing: null,
      workflowSteps: [],
      statusLabel: "In review",
    });

    expect(brain.qualitySummary).toBeNull();
    expect(brain.requiredFixes).toHaveLength(0);
    expect(brain.publicationBlocked).toBe(false);
  });

  it("demo campaign output includes validation intelligence", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const project = domainInput.projects[0]!;
    const ctx = {
      ...resolveBrainPresentationContext({ peerId: "demo", locale: "en", isDemo: true }),
      project,
      domainInput,
      campaignContext: buildCampaignContext({ project, domainInput, locale: "en" }),
    };

    const brain = buildDemoCampaignBrainOutput({ ctx, statusLabel: "In review", workflowSteps: [] });
    expect(brain.qualitySummary).not.toBeNull();
    expect(brain.qualitySummary?.score).toBeGreaterThan(0);
    expect(brain.executiveSummary.narrative).toMatch(/quality review/i);
    expect(brain.activity.some((e) => e.sourceBrain === "validation")).toBe(true);
  });

  it("never leaks technical validation terminology to customer copy", () => {
    const brain = buildBrainWithValidation("READY_WITH_SUGGESTIONS");
    const corpus = JSON.stringify(brain).toLowerCase();
    expect(corpus).not.toMatch(/publicationreadiness|validationgraph|business_fit|legal_claims|evaluator/);
    expect(corpus).not.toMatch(/\bblocked\b.*ready_with_suggestions/);
  });

  it("separates required fixes from optional improvements in recommendations", () => {
    const brainBlocked = buildBrainWithValidation("BLOCKED");
    expect(brainBlocked.recommendations[0]?.headline).toBe("Required fix");

    const brainReady = buildBrainWithValidation("READY_WITH_SUGGESTIONS");
    const optional = brainReady.recommendations.filter((r) => r.headline === "Optional improvement");
    const required = brainReady.recommendations.filter((r) => r.headline === "Required fix");
    expect(required).toHaveLength(0);
    expect(optional.length).toBeGreaterThan(0);
  });
});
