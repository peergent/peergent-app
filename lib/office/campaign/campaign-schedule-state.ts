import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import type { DemoCampaignDomainOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject, LiveCampaignSchedule } from "@/lib/peer-experience/marketing/projects/types";

export type CampaignScheduleRecord = {
  scheduledAt: string;
  channels: readonly string[];
  deliverableIds: readonly string[];
  timezone?: string;
  source?: LiveCampaignSchedule["source"];
};

/** Read canonical schedule record — demo overlay or live project setup. */
export function readCampaignScheduleRecord(
  project: MarketingProject,
  domainInput: MarketingPeerDomainInput,
  isDemo: boolean
): CampaignScheduleRecord | null {
  if (isDemo) {
    const overlay = readDemoCampaignOverlay(
      domainInput as MarketingPeerDomainInput & DemoCampaignDomainOverlay
    );
    const demo = overlay.demoCampaignSchedule?.[project.id];
    if (!demo) return null;
    return {
      scheduledAt: demo.scheduledAt,
      channels: demo.channels,
      deliverableIds: demo.deliverableIds,
    };
  }

  const live = project.campaignSetup?.campaignSchedule;
  if (!live?.scheduledAt) return null;
  return {
    scheduledAt: live.scheduledAt,
    channels: live.channels ?? [],
    deliverableIds: live.deliverableIds ?? [],
    timezone: live.timezone,
    source: live.source,
  };
}

export function isCampaignScheduled(
  project: MarketingProject,
  domainInput: MarketingPeerDomainInput,
  isDemo: boolean
): boolean {
  return readCampaignScheduleRecord(project, domainInput, isDemo) !== null;
}
