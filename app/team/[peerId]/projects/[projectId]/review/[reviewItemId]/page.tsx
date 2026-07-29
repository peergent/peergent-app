"use client";

import { Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import { isMarketingCampaignWorkspaceEnabled } from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";
import { buildMarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-campaign-detail-view-model";
import { buildMarketingCampaignDetailSourceFromDomainInput } from "@/lib/peer-experience/marketing/view-models/build-project-campaign-projection";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { pickCampaignReviewHandlers } from "@/features/marketing-workspace/lib/campaign-review-handlers";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import type { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";
import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import { buildCampaignReviewBuildInput } from "@/features/marketing-workspace/lib/build-campaign-review-input";
import V17CampaignReviewView from "@/features/customer-v17/work/V17CampaignReviewView";
import { getProjectHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { assertCampaignReviewHandlers } from "@/features/marketing-workspace/lib/campaign-review-handlers";

function CampaignReviewBody({
  peerId,
  projectId,
  reviewItemId,
  domainInput,
  workspace,
}: {
  peerId: string;
  projectId: string;
  reviewItemId: string;
  domainInput: MarketingPeerDomainInput;
  workspace: ReturnType<typeof useMarketingWorkspace>;
}) {
  const campaignsEnabled = isMarketingCampaignWorkspaceEnabled();
  const project = domainInput.projects.find((p) => p.id === projectId);

  const campaignDetail = useMemo(() => {
    if (!campaignsEnabled || !project) return null;
    const source = buildMarketingCampaignDetailSourceFromDomainInput(domainInput, projectId);
    return buildMarketingCampaignDetailViewModel(source);
  }, [campaignsEnabled, domainInput, project, projectId]);

  const reviewVm = useMemo(() => {
    if (!campaignsEnabled || !project || !campaignDetail) return null;
    const input = buildCampaignReviewBuildInput({
      peerId,
      projectId,
      domainInput,
      campaignDetail,
      project,
      campaignsEnabled,
      continuationRunning: workspace.campaignContinuationRunning,
      activeWorkUnitId: domainInput.activeWorkUnitId,
    });
    return buildCampaignReviewViewModel(input);
  }, [campaignsEnabled, campaignDetail, domainInput, peerId, project, projectId, workspace.campaignContinuationRunning]);

  const reviewHandlers = useMemo(
    () => pickCampaignReviewHandlers(workspace),
    [workspace]
  );

  const customerLocalePreference = customerLocalePreferenceFromEnv();
  const handlersReady = assertCampaignReviewHandlers(reviewHandlers);

  if (!workspace.isWorkspaceReady) {
    return <p className="v17-page-support">Laden…</p>;
  }

  if (!project || !campaignDetail || !reviewVm) {
    return <p className="v17-page-support">Deze campagne kon niet worden geladen.</p>;
  }

  const item =
    reviewVm.allReviewItems.find(
      (i) => i.id === reviewItemId || i.workUnitId === reviewItemId
    ) ?? null;
  const queue = reviewVm.reviewQueue.filter((i) => i.preview);

  if (!item) {
    return (
      <div className="v17-review-page" data-testid="v17-campaign-review">
        <p className="v17-page-support">Dit onderdeel kon niet worden geladen.</p>
      </div>
    );
  }

  return (
    <V17CampaignReviewView
      peerId={peerId}
      projectId={projectId}
      item={item}
      queue={queue}
      campaignHref={getProjectHref(peerId, projectId)}
      approvalMode={project.campaignSetup?.approvalMode}
      localePreference={customerLocalePreference}
      reviewHandlers={reviewHandlers}
      handlersReady={handlersReady}
    />
  );
}

function CampaignReviewPageInner() {
  const params = useParams<{ peerId: string; projectId: string; reviewItemId: string }>();
  const peerId = params.peerId ?? "";
  const projectId = decodeURIComponent(params.projectId ?? "");
  const reviewItemId = decodeURIComponent(params.reviewItemId ?? "");

  return (
    <MarketingPeerPageFrame activeTab="work">
      {({ domainInput, workspace }) => (
        <CampaignReviewBody
          peerId={peerId}
          projectId={projectId}
          reviewItemId={reviewItemId}
          domainInput={domainInput}
          workspace={workspace}
        />
      )}
    </MarketingPeerPageFrame>
  );
}

export default function CampaignReviewItemPage() {
  return (
    <Suspense fallback={null}>
      <CampaignReviewPageInner />
    </Suspense>
  );
}
