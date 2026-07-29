"use client";

import Link from "next/link";
import { useMemo } from "react";
import { isMarketingCampaignWorkspaceEnabled } from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";
import { buildMarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-campaign-detail-view-model";
import { buildMarketingCampaignDetailSourceFromDomainInput } from "@/lib/peer-experience/marketing/view-models/build-project-campaign-projection";
import { buildMarketingProjectDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-project-detail-view-model";
import { getProjectHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { buildV17CampaignDetailViewModel } from "@/lib/customer-v17/build-v17-campaign-detail-view-model";
import V17CampaignDetailView from "@/features/customer-v17/work/V17CampaignDetailView";
import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import { buildCampaignReviewBuildInput } from "../lib/build-campaign-review-input";
import { isMarketingCampaignInspectorEnabled } from "@/lib/peer-experience/marketing/campaign-inspector-guard";

export type ProjectDetailTabProps = {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  onStartCampaignExecution?: (
    projectId: string
  ) => Promise<
    import("@/lib/peer-experience/marketing/campaign-execution").CampaignExecutionWorkspaceResult
  >;
  onCompleteCampaignOnboarding?: (
    projectId: string,
    input: import("@/lib/peer-experience/marketing/campaign-onboarding").CampaignOnboardingInput
  ) => Promise<
    import("@/lib/peer-experience/marketing/campaign-onboarding").CampaignOnboardingResult
  >;
  onExecuteMarketingWorkUnit?: (
    workUnitId: string
  ) => Promise<
    import("@/lib/peer-experience/marketing/runtime").MarketingWorkUnitExecutionResult
  >;
  onContinueCampaign?: (
    projectId: string
  ) => Promise<
    import("@/lib/peer-experience/marketing/campaign-continuation").CampaignContinuationResult
  >;
  campaignContinuationRunning?: boolean;
  executingWorkUnitId?: string | null;
};

export default function ProjectDetailTab({
  peerId,
  projectId,
  domainInput,
  campaignContinuationRunning,
}: ProjectDetailTabProps) {
  const campaignsEnabled = isMarketingCampaignWorkspaceEnabled();
  const customerLocalePreference = customerLocalePreferenceFromEnv();
  const project = domainInput.projects.find((p) => p.id === projectId);
  const vm = buildMarketingProjectDetailViewModel({ ...domainInput, projectId });

  const campaignDetail = useMemo(() => {
    if (!campaignsEnabled || !vm || !project) return null;
    const source = buildMarketingCampaignDetailSourceFromDomainInput(domainInput, projectId);
    return buildMarketingCampaignDetailViewModel(source);
  }, [campaignsEnabled, domainInput, projectId, vm, project]);

  const reviewVm = useMemo(() => {
    if (!campaignsEnabled || !project || !campaignDetail) return null;
    const input = buildCampaignReviewBuildInput({
      peerId,
      projectId,
      domainInput,
      campaignDetail,
      project,
      campaignsEnabled,
      continuationRunning: campaignContinuationRunning,
      activeWorkUnitId: domainInput.activeWorkUnitId,
    });
    return buildCampaignReviewViewModel(input);
  }, [
    campaignsEnabled,
    campaignDetail,
    domainInput,
    peerId,
    project,
    projectId,
    campaignContinuationRunning,
  ]);

  if (!vm || !project) {
    return (
      <section className="mw-section">
        <p className="mw-empty-inline">This project could not be found.</p>
        <Link href={getProjectHref(peerId)} className="mw-section-link" style={{ marginTop: 12 }}>
          ← Back to Projects
        </Link>
      </section>
    );
  }

  const v17Detail = buildV17CampaignDetailViewModel({
    peerId,
    projectId,
    domainInput,
    project,
    vm,
    campaignDetail,
    reviewVm,
    localePreference: customerLocalePreference,
    showInspectorLink: isMarketingCampaignInspectorEnabled(),
  });

  return <V17CampaignDetailView model={v17Detail} />;
}
