import { describe, expect, it } from "vitest";
import { buildCreativeGraph } from "@/lib/brain/layers/creative/build-creative-graph";
import type { CreativeBrainInput } from "@/lib/brain/layers/creative/types";
import { materializeCreativeContentArtifacts } from "@/lib/brain/layers/creative/materialize-creative-content-artifacts";
import {
  assertCampaignApprovalPackageReady,
  materializeCampaignApprovalPackage,
} from "@/lib/brain/approval/materialize-campaign-approval-package";
import {
  detectFixtureContamination,
  evaluateCreativePublicationInvariants,
  PRODUCTION_FIXTURE_MARKERS,
} from "@/lib/brain/approval/publication-readiness-invariants";
import { evaluateEpisodeApprovalPackageGate } from "@/lib/brain/approval/episode-approval-gate";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";
import { buildValidationGraph } from "@/lib/brain/layers/validation/build-validation-graph";

function minimalCreativeInput(): CreativeBrainInput {
  return {
    organizationId: "org-1",
    projectId: "proj-1",
    locale: "en",
    campaignContext: {
      campaignName: "Launch",
      goals: ["Generate leads"],
      audience: "SMB owners",
      selectedChannels: ["linkedin", "email"],
      projectId: "proj-1",
      peerId: "emma",
      executionMode: "semi_automatic",
      campaignMode: "automatic",
      description: "Drive qualified demos.",
      companyContextState: "available",
      websiteState: "available",
      competitorContextState: "available",
      isSeedCampaign: false,
    } as CreativeBrainInput["campaignContext"],
    strategyGraph: {
      valueProposition: { title: "Value", description: "Premium AI workspace for teams." },
      primaryAudience: { title: "Audience", description: "Marketing leaders at SMBs" },
      strategicPositioning: { title: "Position", description: "AI colleague, not dashboard." },
      recommendedDirection: { title: "Direction", description: "Lead with outcomes." },
      businessSummary: { title: "Business", description: "Peergent helps teams ship faster." },
      differentiators: { title: "Diff", description: "Outcome-first AI workforce." },
      customerProblems: { title: "Pain", description: "Tool sprawl." },
      customerMotivations: { title: "Motivation", description: "Ship campaigns faster." },
      objections: { title: "Objections", description: "Budget." },
      evidenceSummary: { title: "Evidence", description: "Customer interviews." },
    } as CreativeBrainInput["strategyGraph"],
  };
}

describe("PX-57 creative content materialization", () => {
  it("B: creative produces actual content artifacts, not only plan labels", () => {
    const graph = buildCreativeGraph(minimalCreativeInput());
    expect(graph.contentArtifacts?.length).toBeGreaterThan(0);
    for (const artifact of graph.contentArtifacts ?? []) {
      expect(artifact.body.length).toBeGreaterThan(40);
      expect(artifact.cta.trim()).not.toBe("");
      expect(artifact.reviewStatus).toBe("ready_for_review");
      expect(artifact.format).not.toMatch(/plan/i);
    }
  });

  it("A: planning channels flow into creative deliverables with resolved channels", () => {
    const graph = buildCreativeGraph(minimalCreativeInput());
    expect(graph.channelPlans.length).toBeGreaterThan(0);
    expect(graph.deliverables.every((d) => d.channel !== "tbd")).toBe(true);
    expect(graph.deliverables.every((d) => d.reviewStatus === "needs_review")).toBe(true);
  });
});

describe("PX-57 publication readiness invariants", () => {
  it("C: rejects unresolved channel and plan-only deliverables", () => {
    const graph = buildCreativeGraph(minimalCreativeInput());
    const badGraph = {
      ...graph,
      deliverables: graph.deliverables.map((d, i) =>
        i === 0 ? { ...d, channel: "tbd" as typeof d.channel, reviewStatus: "planned" as const } : d
      ),
      contentArtifacts: [],
    };
    const issues = evaluateCreativePublicationInvariants({
      creative: badGraph,
      contentArtifacts: [],
      locale: "en",
    });
    expect(issues.some((i) => i.code === "missing_content_artifacts" && i.blocking)).toBe(true);
  });

  it("D: accepts complete publication-ready campaign package", () => {
    const graph = buildCreativeGraph(minimalCreativeInput());
    const validation = buildValidationGraph({
      organizationId: "org-1",
      projectId: "proj-1",
      locale: "en",
      creativeGraph: graph,
      campaignContext: minimalCreativeInput().campaignContext,
    });
    const pkg = materializeCampaignApprovalPackage({
      organizationId: "org-1",
      projectId: "proj-1",
      campaignName: "Launch",
      campaignContext: minimalCreativeInput().campaignContext,
      creativeGraph: graph,
      validationGraph: validation,
      locale: "en",
    });
    expect(pkg).not.toBeNull();
    expect(pkg!.deliverables.length).toBeGreaterThan(0);
    expect(pkg!.deliverables.every((d) => d.body.length > 40)).toBe(true);
    expect(assertCampaignApprovalPackageReady(pkg!).ok).toBe(true);
  });

  it("J: demo/test fixture markers cannot enter production package", () => {
    for (const marker of PRODUCTION_FIXTURE_MARKERS) {
      expect(detectFixtureContamination(`campaign ${marker} content`)).toBe(marker);
    }
    expect(detectFixtureContamination("Peergent helps marketing leaders ship faster.")).toBeNull();
  });
});

describe("PX-57 approval boundary", () => {
  it("E: waiting_for_approval gate blocks when package not ready", () => {
    const graph = buildCreativeGraph(minimalCreativeInput());
    const episode = {
      snapshot: {
        organizationId: "org-1",
        projectId: "proj-1",
        state: "validating",
      },
      resolvedGraphs: {
        creativeGraph: { ...graph, contentArtifacts: [] },
      },
    } as ProjectEpisodeRecord;
    const gate = evaluateEpisodeApprovalPackageGate(episode);
    expect(gate.allowed).toBe(false);
  });

  it("F: approval package references creative artifact version ids", () => {
    const graph = buildCreativeGraph(minimalCreativeInput());
    const pkg = materializeCampaignApprovalPackage({
      organizationId: "org-1",
      projectId: "proj-1",
      campaignName: "Launch",
      creativeGraph: graph,
      validationGraph: null,
      locale: "en",
    });
    expect(pkg?.version.creativeGraphRef).toContain("creative:org-1:proj-1:");
    expect(pkg?.deliverables[0]?.sourceDeliverableId).toMatch(/^del-/);
  });
});

describe("PX-57 production regression patterns", () => {
  it("rejects capability-style tbd channel + semi-automatic plan records", () => {
    const issues = evaluateCreativePublicationInvariants({
      creative: {
        deliverables: [
          {
            id: "del-1",
            type: "linkedin_post",
            channel: "tbd" as never,
            headline: "Test",
            hook: "Hook",
            bodyOutline: "Outline",
            cta: "Learn more",
            headlineVariations: [],
            ctaVariations: [],
            hookVariations: [],
            rationale: "Because",
            reviewStatus: "planned",
          },
        ],
      } as never,
      contentArtifacts: [],
      locale: "en",
    });
    expect(issues.some((i) => i.code === "unresolved_channel")).toBe(true);
    expect(issues.some((i) => i.code === "plan_only_deliverable")).toBe(true);
  });
});
