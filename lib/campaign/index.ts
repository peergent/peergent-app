export {
  CAMPAIGN_EXCLUDED_CONCERNS,
  CAMPAIGN_GAPS,
  CAMPAIGN_IDENTITY_FIELDS,
  CAMPAIGN_MODULE_DESCRIPTIONS,
  CAMPAIGN_OWNED_MODULES,
  CAMPAIGN_REQUIRED_SECTIONS,
} from "./ownership";

export type {
  CampaignExcludedConcern,
  CampaignGap,
  CampaignIdentityField,
  CampaignOwnedModule,
  CampaignRequiredSection,
} from "./ownership";

export { assembleCampaign, deriveCampaignStatus, campaignStatusFromFlagsOnly } from "./assemble-campaign";

export type {
  CampaignAudienceInput,
  CampaignBudgetInput,
  CampaignProgressInput,
  CampaignSource,
  CampaignStatusFlags,
  CampaignTimelineInput,
  CampaignWorkforceAssignment,
} from "./campaign-source";

export {
  CampaignAssemblyError,
  CampaignContradictoryStatusError,
  CampaignInvalidBudgetError,
  CampaignInvalidCampaignIdError,
  CampaignInvalidCompletionError,
  CampaignInvalidOrganizationIdError,
  CampaignInvalidProgressError,
  CampaignInvalidTimelineError,
  CampaignOrganizationMismatchError,
  CampaignUnsupportedWorkforceRoleError,
} from "./errors";

export type {
  Campaign,
  CampaignApprovalMode,
  CampaignAudience,
  CampaignBudget,
  CampaignChannelPlan,
  CampaignExecution,
  CampaignGoal,
  CampaignKpiPlaceholder,
  CampaignMilestone,
  CampaignPerformance,
  CampaignPersona,
  CampaignProgress,
  CampaignRecommendation,
  CampaignReferences,
  CampaignSectionKey,
  CampaignSegmentRef,
  CampaignStatus,
  CampaignSuccessMetric,
  CampaignTimeline,
  CampaignWorker,
  CampaignWorkerRole,
  CampaignWorkerStatus,
  CampaignWorkforce,
  CampaignOwnedSections,
} from "./types";

export {
  CAMPAIGN_WORKFORCE_ROLE_LABELS,
  CAMPAIGN_WORKFORCE_ROLES,
} from "./types";
