import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { ActivityFeedItem } from "@/lib/marketing-workspace";
import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import type { IntegrationConnection } from "@/lib/integrations/types";
import type { MetricSnapshot } from "@/lib/metrics/types";
import type { PublicationPackage } from "@/lib/peer-workflow";
import type { WorkUnit, WorkAutomation } from "@/lib/peer-workflow/work-unit";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { ApprovalDeliverableOverlay } from "../approval/approval-overlay";
import type {
  CampaignArtifactVersionMap,
  CampaignReviewDecisionHistoryMap,
  CampaignReviewDecisionMap,
} from "../campaign-review-decisions";
import type { InsightRotationState } from "../build-insights-engine";

/** Shared inputs for Marketing Peer page view models. */
export type MarketingPeerDomainInput = {
  peerId: string;
  organizationId?: string;
  userName: string;
  peerName: string;
  campaignTitle: string;
  generating: GeneratingActivity | null;
  generatingActivity: string | null;
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  linkedinPostByWorkUnitId?: Readonly<
    Record<string, import("@/lib/marketing-intelligence/linkedin-post-generation").MarketingLinkedInPost>
  >;
  emailByWorkUnitId?: Readonly<
    Record<string, import("@/lib/marketing-intelligence/email-generation").MarketingEmailCampaign>
  >;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  publicationPackages: PublicationPackage[];
  activityFeed: ActivityFeedItem[];
  workUnits: WorkUnit[];
  projects: MarketingProject[];
  responsibilities: MarketingResponsibility[];
  automations: WorkAutomation[];
  connections: IntegrationConnection[];
  storedMetrics?: MetricSnapshot[];
  approvalOverlays?: Record<string, ApprovalDeliverableOverlay>;
  campaignReviewDecisionByWorkUnitId?: CampaignReviewDecisionMap;
  campaignReviewDecisionHistoryByWorkUnitId?: CampaignReviewDecisionHistoryMap;
  campaignArtifactVersionByWorkUnitId?: CampaignArtifactVersionMap;
  insightRotation?: InsightRotationState;
  selectedWorkUnitId?: string | null;
  activeWorkUnitId?: string | null;
  selectedDraftId?: string | null;
};
