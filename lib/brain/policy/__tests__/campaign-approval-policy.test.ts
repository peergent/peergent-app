import { describe, expect, it } from "vitest";
import type { BrainActionProposal } from "@/lib/brain/evidence/structured-output";
import {
  classifyActionProposal,
  hasExternalActionProposals,
  resolveCapabilityActionClass,
} from "@/lib/brain/policy/action-class";
import {
  evaluateCampaignBrainPolicy,
  requiresGuidedCognitiveCheckpoint,
  requiresPublicationApproval,
  resolveCampaignBrainPolicy,
  shouldPauseRunForPolicy,
} from "@/lib/brain/policy/campaign-approval-policy";
import { resolveApprovalGate } from "@/lib/brain/project-engine/approval-model";
import { resolveFinalRunStatus } from "@/lib/brain/policy/resolve-run-policy";

const cognitiveProposal: BrainActionProposal = {
  id: "a1",
  actionType: "approve_strategy",
  label: "Review strategy",
  rationale: "Customer review",
  requiresApproval: true,
};

const externalProposal: BrainActionProposal = {
  id: "a2",
  actionType: "publish",
  label: "Publish campaign",
  rationale: "Go live",
  requiresApproval: true,
};

describe("PX-50.22 campaign approval policy", () => {
  describe("cognitive vs external classification", () => {
    it("O — optimization recommendation is cognitive", () => {
      expect(resolveCapabilityActionClass("optimization")).toBe("cognitive");
      expect(
        classifyActionProposal({
          id: "r1",
          actionType: "recommend_budget_shift",
          label: "Shift budget",
          rationale: "Performance",
          requiresApproval: false,
        })
      ).toBe("cognitive");
    });

    it("P — apply live optimization change is external", () => {
      expect(
        classifyActionProposal({
          id: "a1",
          actionType: "apply_optimization",
          label: "Apply",
          rationale: "Live change",
          requiresApproval: false,
        })
      ).toBe("external");
    });
  });

  describe("approval_before_publication — cognitive auto", () => {
    const mode = "approval_before_publication" as const;

    it("A — strategy completes without approval pause", () => {
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: mode,
        capabilityId: "strategy",
        actionProposals: [cognitiveProposal],
      });
      expect(evaluated.decision).toBe("allow");
      expect(evaluated.willPause).toBe(false);
    });

    it("B — channel planning auto", () => {
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: mode,
        capabilityId: "channel_planning",
      });
      expect(evaluated.decision).toBe("allow");
      expect(evaluated.willPause).toBe(false);
    });

    it("C — campaign planning auto", () => {
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: mode,
        capabilityId: "campaign_planning",
      });
      expect(evaluated.decision).toBe("allow");
    });

    it("D — creative generation auto", () => {
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: mode,
        capabilityId: "creative_generation",
      });
      expect(evaluated.decision).toBe("allow");
    });

    it("E — validation auto", () => {
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: mode,
        capabilityId: "validation",
      });
      expect(evaluated.decision).toBe("allow");
    });

    it("F — execution requires approval", () => {
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: mode,
        capabilityId: "execution",
      });
      expect(evaluated.decision).toBe("require_approval");
      expect(evaluated.willPause).toBe(true);
    });

    it("N — LLM requiresApproval true does not force cognitive approval", () => {
      expect(
        shouldPauseRunForPolicy({
          policyDecision: "allow",
          actionProposals: [cognitiveProposal],
          capabilityId: "strategy",
          campaignApprovalMode: mode,
        })
      ).toBe(false);
    });
  });

  describe("PE gates — no double gating", () => {
    it("skips strategy_review in approval_before_publication", () => {
      expect(resolveApprovalGate("strategy", "approval_before_publication")).toBeNull();
      expect(resolveApprovalGate("planning", "approval_before_publication")).toBeNull();
      expect(resolveApprovalGate("creative", "approval_before_publication")).toBeNull();
    });

    it("H — guided mode retains strategy checkpoint", () => {
      expect(resolveApprovalGate("strategy", "approval_before_generation")).not.toBeNull();
      expect(requiresGuidedCognitiveCheckpoint("approval_before_generation", "strategy")).toBe(true);
    });
  });

  describe("no_approval_required", () => {
    it("K — permits external where policy allows", () => {
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: "no_approval_required",
        capabilityId: "execution",
      });
      expect(evaluated.decision).toBe("allow");
    });
  });

  describe("blocked_manual_only", () => {
    it("L — blocks silently executing", () => {
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: "blocked_manual_only",
        capabilityId: "strategy",
      });
      expect(evaluated.decision).toBe("block");
    });
  });

  describe("LLM requiresApproval cannot bypass external safety", () => {
    it("M — LLM requiresApproval false cannot bypass execution approval", () => {
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: "approval_before_publication",
        capabilityId: "execution",
        actionProposals: [
          {
            id: "x",
            actionType: "publish",
            label: "Publish",
            rationale: "Go",
            requiresApproval: false,
          },
        ],
      });
      expect(evaluated.decision).toBe("require_approval");
    });

    it("external proposals in cognitive capability still require approval", () => {
      expect(
        hasExternalActionProposals([
          {
            id: "p",
            actionType: "publish",
            label: "Publish",
            rationale: "x",
            requiresApproval: false,
          },
        ])
      ).toBe(true);
      const evaluated = evaluateCampaignBrainPolicy({
        campaignApprovalMode: "approval_before_publication",
        capabilityId: "strategy",
        actionProposals: [externalProposal],
      });
      expect(evaluated.decision).toBe("require_approval");
    });
  });

  describe("resolveFinalRunStatus", () => {
    it("J — waiting_for_approval is distinct from waiting_for_input", () => {
      const status = resolveFinalRunStatus({
        request: {
          organizationId: "org-1",
          peerId: "emma",
          capabilityId: "execution",
          actorId: "test",
          campaignApprovalMode: "approval_before_publication",
        },
        policy: { decision: "require_approval", reason: "external" },
        output: { actionProposals: [externalProposal] },
        readinessPartial: false,
      });
      expect(status).toBe("waiting_for_approval");
      expect(status).not.toBe("waiting_for_input");
    });
  });

  describe("canonical mapper", () => {
    it("maps approval_before_publication to semi_automatic execution mode", () => {
      expect(
        resolveCampaignBrainPolicy({
          campaignApprovalMode: "approval_before_publication",
          capabilityId: "strategy",
        }).executionMode
      ).toBe("semi_automatic");
    });

    it("publication approval required for default mode", () => {
      expect(requiresPublicationApproval("approval_before_publication")).toBe(true);
      expect(requiresPublicationApproval("no_approval_required")).toBe(false);
    });
  });
});
