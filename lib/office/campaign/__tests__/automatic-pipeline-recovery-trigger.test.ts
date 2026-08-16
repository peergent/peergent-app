import { describe, expect, it } from "vitest";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  evaluateAutomaticPipelineRecoveryOnMount,
  isAutomaticCampaignPastStrategyBootstrap,
} from "@/lib/office/campaign/automatic-campaign-lifecycle";

function automaticProject(
  setup?: Partial<NonNullable<ReturnType<typeof createMarketingCampaignProject>["campaignSetup"]>>
) {
  const project = createMarketingCampaignProject({
    peerId: "emma",
    ownerLabel: "Emma",
    name: "PX-54A Recovery",
    goalLabel: "Leads",
    description: "Recovery trigger test.",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
  });
  return {
    ...project,
    campaignSetup: {
      ...project.campaignSetup!,
      ...setup,
    },
  };
}

describe("PX-54A automatic pipeline recovery mount gate", () => {
  it("blocks pre-strategy bootstrap", () => {
    const project = automaticProject({ strategyGeneratedAt: undefined, strategyRun: { status: "idle" } });
    expect(evaluateAutomaticPipelineRecoveryOnMount(project)).toEqual({
      eligible: false,
      decisionReason: "pre_strategy_bootstrap",
    });
  });

  it("allows recovery when strategyGeneratedAt is present", () => {
    const project = automaticProject({
      strategyGeneratedAt: "2026-08-16T18:00:00.000Z",
      strategyRun: { status: "completed" },
    });
    expect(evaluateAutomaticPipelineRecoveryOnMount(project)).toEqual({
      eligible: true,
      decisionReason: "strategy_generated_at",
    });
  });

  it("allows recovery when client timed out but strategy run is still in flight (production stall pattern)", () => {
    const project = automaticProject({
      strategyGeneratedAt: undefined,
      strategyRun: { status: "running", startedAt: "2026-08-16T18:00:00.000Z" },
    });
    expect(isAutomaticCampaignPastStrategyBootstrap(project)).toBe(true);
    expect(evaluateAutomaticPipelineRecoveryOnMount(project)).toEqual({
      eligible: true,
      decisionReason: "strategy_run_in_flight",
    });
  });

  it("allows recovery via campaignBrainOutputs.strategy without strategyGeneratedAt", () => {
    const project = automaticProject({
      strategyGeneratedAt: undefined,
      campaignBrainOutputs: {
        contextVersion: 1,
        strategy: {
          capabilityIds: ["strategy"],
          generatedAt: "2026-08-16T18:00:00.000Z",
          findings: [],
          decisions: [],
          decisionRecords: [],
        },
      },
    });
    expect(evaluateAutomaticPipelineRecoveryOnMount(project)).toEqual({
      eligible: true,
      decisionReason: "strategy_brain_output",
    });
  });

  it("blocks manual setup", () => {
    const project = automaticProject({
      setupMode: "manual",
      strategyGeneratedAt: "2026-08-16T18:00:00.000Z",
    });
    expect(evaluateAutomaticPipelineRecoveryOnMount(project)).toEqual({
      eligible: false,
      decisionReason: "manual_setup",
    });
  });
});
