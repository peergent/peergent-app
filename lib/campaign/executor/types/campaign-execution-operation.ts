export type CampaignExecutionOperationType =
  | "CREATE_WORK_UNIT"
  | "ASSIGN_WORK_UNIT_OWNER"
  | "LINK_WORK_UNIT_DEPENDENCY"
  | "REQUEST_APPROVAL"
  | "MARK_CAMPAIGN_READY"
  | "MARK_CAMPAIGN_ACTIVE";

export type CampaignExecutionOperationPrecondition = {
  readonly code: string;
  readonly message: string;
};

export type CampaignExecutionCreateWorkUnitPayload = {
  readonly proposedWorkUnitRef: string;
  readonly title: string;
  readonly channel: string;
  readonly deliverableKind: string;
  readonly workPackageType: string;
  readonly planActivityReference?: string;
  readonly objective?: string;
};

export type CampaignExecutionAssignOwnerPayload = {
  readonly workUnitRef: string;
  readonly responsibilityId: string;
  readonly ownerRole: string;
  readonly ownerLabel?: string;
};

export type CampaignExecutionLinkDependencyPayload = {
  readonly dependentWorkUnitRef: string;
  readonly dependsOnWorkUnitRef: string;
  readonly sourceWorkPackageId: string;
  readonly dependsOnWorkPackageId: string;
};

export type CampaignExecutionRequestApprovalPayload = {
  readonly approvalGate: "before_work" | "before_generation" | "before_publication" | "manual_only";
  readonly sourceWorkPackageId: string;
  readonly workUnitRef?: string;
  readonly brandReviewRequired?: boolean;
  readonly legalReviewRequired?: boolean;
};

export type CampaignExecutionMarkCampaignPayload = {
  readonly fromStatus: string;
  readonly toStatus: string;
};

export type CampaignExecutionOperationBase = {
  readonly id: string;
  readonly type: CampaignExecutionOperationType;
  readonly campaignId: string;
  readonly sourceWorkPackageId?: string;
  readonly sequence: number;
  readonly reason: string;
  readonly preconditions: readonly CampaignExecutionOperationPrecondition[];
  readonly idempotencyKey: string;
};

export type CampaignExecutionCreateWorkUnitOperation = CampaignExecutionOperationBase & {
  readonly type: "CREATE_WORK_UNIT";
  readonly payload: CampaignExecutionCreateWorkUnitPayload;
};

export type CampaignExecutionAssignOwnerOperation = CampaignExecutionOperationBase & {
  readonly type: "ASSIGN_WORK_UNIT_OWNER";
  readonly payload: CampaignExecutionAssignOwnerPayload;
};

export type CampaignExecutionLinkDependencyOperation = CampaignExecutionOperationBase & {
  readonly type: "LINK_WORK_UNIT_DEPENDENCY";
  readonly payload: CampaignExecutionLinkDependencyPayload;
};

export type CampaignExecutionRequestApprovalOperation = CampaignExecutionOperationBase & {
  readonly type: "REQUEST_APPROVAL";
  readonly payload: CampaignExecutionRequestApprovalPayload;
};

export type CampaignExecutionMarkCampaignReadyOperation = CampaignExecutionOperationBase & {
  readonly type: "MARK_CAMPAIGN_READY";
  readonly payload: CampaignExecutionMarkCampaignPayload;
};

export type CampaignExecutionMarkCampaignActiveOperation = CampaignExecutionOperationBase & {
  readonly type: "MARK_CAMPAIGN_ACTIVE";
  readonly payload: CampaignExecutionMarkCampaignPayload;
};

export type CampaignExecutionOperation =
  | CampaignExecutionCreateWorkUnitOperation
  | CampaignExecutionAssignOwnerOperation
  | CampaignExecutionLinkDependencyOperation
  | CampaignExecutionRequestApprovalOperation
  | CampaignExecutionMarkCampaignReadyOperation
  | CampaignExecutionMarkCampaignActiveOperation;
