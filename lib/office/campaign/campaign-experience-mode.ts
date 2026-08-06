import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";

/** Customer-facing campaign experience mode (Sprint 9.3). */
export type CampaignExperienceMode = "full_autonomy" | "approval_required" | "guided";

/**
 * Maps workspace approval setting to experience mode.
 * - no_approval_required → full autonomy
 * - approval_before_publication → approval required (executive briefing — recommended default)
 * - approval_before_generation → guided (step-by-step review)
 */
export function resolveCampaignExperienceMode(
  approvalMode?: CampaignApprovalMode
): CampaignExperienceMode {
  switch (approvalMode) {
    case "no_approval_required":
      return "full_autonomy";
    case "approval_before_generation":
      return "guided";
    case "blocked_manual_only":
      return "guided";
    default:
      return "approval_required";
  }
}

export function shouldUseExecutiveBriefing(mode: CampaignExperienceMode): boolean {
  return mode === "approval_required" || mode === "full_autonomy";
}

export function requiresStepByStepReview(mode: CampaignExperienceMode): boolean {
  return mode === "guided";
}

export function evidenceIsOptional(mode: CampaignExperienceMode): boolean {
  return mode !== "guided";
}
