"use client";

import OverviewTab from "@/features/marketing-workspace/tabs/OverviewTab";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

export type MarketingOverviewPageProps = {
  domainInput: MarketingPeerDomainInput;
  onDismissInsight?: (id: string) => void;
  onApproveResponsibilityPlan?: (responsibilityId: string) => void | Promise<void>;
  approvingResponsibilityId?: string | null;
};

export default function MarketingOverviewPage({
  domainInput,
  onDismissInsight,
}: MarketingOverviewPageProps) {
  return <OverviewTab domainInput={domainInput} onDismissInsight={onDismissInsight} />;
}
