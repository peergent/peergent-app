export type CampaignExecutionPlanOverallStatus =
  | "draft"
  | "ready"
  | "restricted"
  | "blocked";

export type CampaignExecutionPlanAvailability = "visible" | "unavailable";

export type CampaignExecutionPlanPhaseViewModel = {
  readonly label: string;
  readonly stepCount: number;
};

export type CampaignExecutionPlanWorkItemViewModel = {
  readonly title: string;
  /** Detailed copy; omitted from compact scan UI when empty. */
  readonly description: string;
  readonly phaseLabel: string;
  readonly statusLabel: string;
  readonly ownerLabel: string;
  readonly effortLabel: string;
  readonly compactMeta?: string;
  readonly approvalLabel?: string;
  readonly dependencySummary?: string;
  readonly blockerSummary?: string;
  readonly channelLabel?: string;
  readonly deliverableLabel?: string;
};

export type CampaignExecutionPlanPhaseGroupViewModel = {
  readonly phaseLabel: string;
  readonly items: readonly CampaignExecutionPlanWorkItemViewModel[];
};

export type CampaignExecutionPlanApprovalMomentViewModel = {
  readonly label: string;
  readonly description: string;
};

export type CampaignExecutionPlanNextStepViewModel = {
  readonly title: string;
  readonly description: string;
};

export type CampaignExecutionPlanViewModel = {
  readonly availability: CampaignExecutionPlanAvailability;
  readonly unavailableMessage?: string;
  readonly overallStatus: CampaignExecutionPlanOverallStatus;
  readonly statusLabel: string;
  readonly objective: string;
  readonly progressSummary: string;
  readonly planStepsComplete: number;
  readonly planStepsTotal: number;
  readonly phases: readonly CampaignExecutionPlanPhaseViewModel[];
  readonly workItems: readonly CampaignExecutionPlanWorkItemViewModel[];
  readonly approvalMoments: readonly CampaignExecutionPlanApprovalMomentViewModel[];
  readonly blockers: readonly string[];
  readonly missingInformation: readonly string[];
  readonly optionalImprovements: readonly string[];
  readonly warnings: readonly string[];
  readonly nextPlannedStep: CampaignExecutionPlanNextStepViewModel | null;
  readonly restrictionMessage?: string;
  readonly phaseGroups: readonly CampaignExecutionPlanPhaseGroupViewModel[];
};

export type CampaignExecutionPlanViewModelResult =
  | { readonly ok: true; readonly viewModel: CampaignExecutionPlanViewModel }
  | { readonly ok: false; readonly unavailableMessage: string };
