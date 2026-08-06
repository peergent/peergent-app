"use client";

import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import ExecutiveCampaignBriefingPanel from "./ExecutiveCampaignBriefingPanel";
import V17CampaignApprovalActions from "@/features/customer-v17/work/V17CampaignApprovalActions";
import { buildExecutiveBriefingStepHref } from "../lib/build-executive-briefing-step-href";

export type ExecutiveCampaignBriefingExperienceProps = {
  peerId: string;
  projectId: string;
  briefing: ExecutiveCampaignBriefing;
  allReviewItems: readonly CampaignReviewItem[];
  pendingApproval: boolean;
  publicationUnlocked: boolean;
  locale?: "nl" | "en";
  onApproveCampaign?: (input: { projectId: string }) => Promise<
    import("@/lib/peer-experience/marketing/campaign-approval").CampaignApprovalResult
  >;
};

export default function ExecutiveCampaignBriefingExperience({
  peerId,
  projectId,
  briefing,
  allReviewItems,
  pendingApproval,
  publicationUnlocked,
  locale = "en",
  onApproveCampaign,
}: ExecutiveCampaignBriefingExperienceProps) {
  return (
    <section className="mw-section" data-testid="mw-executive-briefing-experience">
      <ExecutiveCampaignBriefingPanel
        briefing={briefing}
        locale={locale}
        buildStepHref={(stepId) =>
          buildExecutiveBriefingStepHref({
            peerId,
            projectId,
            stepId,
            allReviewItems,
          })
        }
      />

      {onApproveCampaign ? (
        <V17CampaignApprovalActions
          projectId={projectId}
          pendingApproval={pendingApproval}
          publicationUnlocked={publicationUnlocked}
          locale={locale}
          onApproveCampaign={onApproveCampaign}
        />
      ) : null}
    </section>
  );
}
