"use client";

import { Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import CustomerCampaignReviewExperience from "@/features/marketing-workspace/components/CustomerCampaignReviewExperience";
import { isMarketingCampaignWorkspaceEnabled } from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";
import { buildMarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-campaign-detail-view-model";
import { buildMarketingCampaignDetailSourceFromDomainInput } from "@/lib/peer-experience/marketing/view-models/build-project-campaign-projection";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

function CampaignReviewBody({
  peerId,
  projectId,
  reviewItemId,
  domainInput,
}: {
  peerId: string;
  projectId: string;
  reviewItemId: string;
  domainInput: MarketingPeerDomainInput;
}) {
  const campaignsEnabled = isMarketingCampaignWorkspaceEnabled();
  const project = domainInput.projects.find((p) => p.id === projectId);

  const campaignDetail = useMemo(() => {
    if (!campaignsEnabled || !project) return null;
    const source = buildMarketingCampaignDetailSourceFromDomainInput(domainInput, projectId);
    return buildMarketingCampaignDetailViewModel(source);
  }, [campaignsEnabled, domainInput, project, projectId]);

  if (!project || !campaignDetail) {
    return <p className="mw-empty-inline">This campaign could not be found.</p>;
  }

  return (
    <CustomerCampaignReviewExperience
      peerId={peerId}
      projectId={projectId}
      reviewItemId={reviewItemId}
      domainInput={domainInput}
      campaign={campaignDetail}
      project={project}
      campaignsEnabled={campaignsEnabled}
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
      {({ domainInput }) => (
        <CampaignReviewBody
          peerId={peerId}
          projectId={projectId}
          reviewItemId={reviewItemId}
          domainInput={domainInput}
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
